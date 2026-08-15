import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { CloneService } from "../src/cloneService.ts";
import { InMemoryCloneJobManager } from "../src/jobManager.ts";
import { LocalCloneInputPolicy } from "../src/pathPolicy.ts";
import { FileSystemCloneResultInspector } from "../src/resultInspector.ts";
import { createCloneMcpServer } from "../src/mcpServer.ts";
import type { CompilerRunResult, NormalizedCloneRequest } from "../src/types.ts";

const normalized: NormalizedCloneRequest = {
  source: "/workspace/page.mhtml", outputDir: "/workspace/output", framework: "next", styling: "tailwind",
};
const compiled: CompilerRunResult = {
  sourceUrl: "https://example.com/", runDir: "/run", sourceDir: "/run/source",
  appDir: "/run/app", nodeCount: 12, missingAssets: 0,
};

function parseToolResult(result: unknown): Record<string, any> {
  const content = (result as { content?: Array<{ type: string; text?: string }> }).content;
  assert.equal(content?.[0]?.type, "text");
  return JSON.parse(content?.[0]?.text ?? "{}");
}

test("service composes interchangeable interfaces and reports progress", async () => {
  const calls: string[] = [];
  const events: unknown[] = [];
  const service = new CloneService({
    policy: { normalize: async () => { calls.push("policy"); return normalized; } },
    compiler: { run: async (_r, c) => { calls.push("compiler"); await c.progress.emit({ event: "captured" }); return compiled; } },
    inspector: { inspect: async () => { calls.push("inspector"); return { fileCount: 1, totalBytes: 3, files: ["a"] }; } },
  });
  const result = await service.clone({ source: "x" }, { progress: { emit: e => { events.push(e); } } });
  assert.deepEqual(calls, ["policy", "compiler", "inspector"]);
  assert.equal(result.status, "succeeded");
  assert.equal(events.length, 3);
});

test("service locks, unlocks after errors, ignores progress failures, and cancels", async () => {
  let release!: () => void;
  const wait = new Promise<void>(resolve => { release = resolve; });
  let first = true;
  const service = new CloneService({
    policy: { normalize: async () => normalized },
    compiler: { run: async () => { if (first) { first = false; await wait; } return compiled; } },
    inspector: { inspect: async () => ({ fileCount: 0, totalBytes: 0, files: [] }) },
  });
  const active = service.clone({ source: "x" }, { progress: { emit: () => { throw new Error("closed"); } } });
  await new Promise(resolve => setImmediate(resolve));
  await assert.rejects(() => service.clone({ source: "y" }), /already running/);
  release();
  await active;
  assert.equal((await service.clone({ source: "z" })).status, "succeeded");

  const controller = new AbortController();
  controller.abort();
  await assert.rejects(() => service.clone({ source: "x" }, { signal: controller.signal }), /aborted/i);
});

test("path policy accepts bounded inputs and rejects traversal, symlinks, and extensions", async () => {
  const root = mkdtempSync(join(tmpdir(), "policy-"));
  const outside = mkdtempSync(join(tmpdir(), "outside-"));
  try {
    const page = join(root, "page.mht");
    writeFileSync(page, "mhtml");
    const policy = new LocalCloneInputPolicy({ inputRoot: root, outputRoot: root });
    assert.equal((await policy.normalize({ source: page, outputDir: "out" })).outputDir, join(root, "out"));
    assert.equal((await policy.normalize({ source: "HTTPS://Example.com/" })).source, "https://example.com/");
    const html = join(root, "page.html"); writeFileSync(html, "html");
    await assert.rejects(() => policy.normalize({ source: html }), /\.mhtml or \.mht/);
    const target = join(outside, "x.mhtml"); writeFileSync(target, "x");
    const link = join(root, "link.mhtml"); symlinkSync(target, link);
    await assert.rejects(() => policy.normalize({ source: link }), /must stay within/);
    await assert.rejects(() => policy.normalize({ source: page, outputDir: outside }), /must stay within/);
  } finally { rmSync(root, { recursive: true, force: true }); rmSync(outside, { recursive: true, force: true }); }
});

test("file inspector returns sorted files and bytes while ignoring symlinks", async () => {
  const root = mkdtempSync(join(tmpdir(), "inspect-"));
  try {
    mkdirSync(join(root, "src")); writeFileSync(join(root, "b"), "22"); writeFileSync(join(root, "src", "a"), "1");
    symlinkSync(join(root, "b"), join(root, "link"));
    assert.deepEqual(await new FileSystemCloneResultInspector().inspect(root), {
      fileCount: 2, totalBytes: 3, files: ["b", "src/a"],
    });
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("MCP starts a clone, reports cursor progress, and returns its result", async () => {
  let called = 0;
  let release!: () => void;
  const wait = new Promise<void>((resolve) => { release = resolve; });
  const service = new CloneService({
    policy: { normalize: async () => { called++; return normalized; } },
    compiler: { run: async (_r, c) => { await c.progress.emit({ event: "captured" }); await wait; return compiled; } },
    inspector: { inspect: async () => ({ fileCount: 1, totalBytes: 1, files: ["x"] }) },
  });
  const jobs = new InMemoryCloneJobManager(service, { createId: () => "mcp-job" });
  const server = createCloneMcpServer(jobs, { pollAfterMs: 500 });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "1" });
  await Promise.all([server.connect(st), client.connect(ct)]);
  try {
    const startedResult = await client.callTool({ name: "clone_page", arguments: { source: "x", framework: "vite" } });
    assert.equal(startedResult.isError, undefined);
    const started = parseToolResult(startedResult);
    assert.deepEqual(started, { jobId: "mcp-job", status: "running", pollAfterMs: 500 });

    await new Promise((resolve) => setImmediate(resolve));
    const running = parseToolResult(await client.callTool({
      name: "get_clone_status", arguments: { jobId: started.jobId, after: 0 },
    }));
    assert.equal(running.status, "running");
    assert.ok(running.events.some((event: { event: string }) => event.event === "captured"));

    const busy = await client.callTool({ name: "clone_page", arguments: { source: "y" } });
    assert.equal(busy.isError, true);
    assert.match(parseToolResult(busy).error, /mcp-job/);

    release();
    let completed: Record<string, any> = {};
    for (let attempt = 0; attempt < 20 && completed.status !== "succeeded"; attempt++) {
      await new Promise((resolve) => setImmediate(resolve));
      completed = parseToolResult(await client.callTool({
        name: "get_clone_status",
        arguments: { jobId: started.jobId, after: running.nextCursor },
      }));
    }
    assert.equal(completed.status, "succeeded");
    assert.equal(completed.result.appDir, "/run/app");
    assert.ok(completed.events.every((event: { cursor: number }) => event.cursor > running.nextCursor));

    const bad = await client.callTool({ name: "clone_page", arguments: { source: "x", framework: "bad" } });
    assert.equal(bad.isError, true);
    assert.equal(called, 1);
  } finally { await Promise.all([client.close(), server.close()]); }
});

test("MCP blocking compatibility emits notifications and returns the direct result", async () => {
  const service = new CloneService({
    policy: { normalize: async () => normalized },
    compiler: { run: async (_r, c) => { await c.progress.emit({ event: "captured" }); return compiled; } },
    inspector: { inspect: async () => ({ fileCount: 1, totalBytes: 1, files: ["x"] }) },
  });
  const server = createCloneMcpServer(
    new InMemoryCloneJobManager(service, { createId: () => "blocking-job" }),
    { waitByDefault: true },
  );
  const [ct, st] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "1" });
  await Promise.all([server.connect(st), client.connect(ct)]);
  try {
    const progress: unknown[] = [];
    const response = await client.callTool(
      { name: "clone_page", arguments: { source: "x" } },
      undefined,
      { onprogress: (event) => progress.push(event) },
    );
    assert.equal(response.isError, undefined);
    assert.equal(parseToolResult(response).status, "succeeded");
    assert.equal(progress.length, 5);
  } finally { await Promise.all([client.close(), server.close()]); }
});

test("MCP cancel_clone aborts an active clone", async () => {
  const service = new CloneService({
    policy: { normalize: async () => normalized },
    compiler: {
      run: async (_request, context) => new Promise<CompilerRunResult>((_resolve, reject) => {
        context.signal.addEventListener("abort", () => reject(context.signal.reason), { once: true });
      }),
    },
    inspector: { inspect: async () => ({ fileCount: 0, totalBytes: 0, files: [] }) },
  });
  const server = createCloneMcpServer(new InMemoryCloneJobManager(service, { createId: () => "cancel-job" }));
  const [ct, st] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "1" });
  await Promise.all([server.connect(st), client.connect(ct)]);
  try {
    const started = parseToolResult(await client.callTool({ name: "clone_page", arguments: { source: "x" } }));
    await new Promise((resolve) => setImmediate(resolve));
    const cancelling = parseToolResult(await client.callTool({
      name: "cancel_clone", arguments: { jobId: started.jobId },
    }));
    assert.equal(cancelling.status, "cancelling");
    assert.equal(cancelling.cancellationRequested, true);

    let cancelled: Record<string, any> = {};
    for (let attempt = 0; attempt < 20 && cancelled.status !== "cancelled"; attempt++) {
      await new Promise((resolve) => setImmediate(resolve));
      cancelled = parseToolResult(await client.callTool({
        name: "get_clone_status", arguments: { jobId: started.jobId },
      }));
    }
    assert.equal(cancelled.status, "cancelled");
    assert.equal(cancelled.error, "clone cancelled");
  } finally { await Promise.all([client.close(), server.close()]); }
});
