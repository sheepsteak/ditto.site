import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { CloneService } from "../src/cloneService.ts";
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

test("MCP schema, success, progress, and tool errors", async () => {
  let called = 0;
  const service = new CloneService({
    policy: { normalize: async () => { called++; return normalized; } },
    compiler: { run: async (_r, c) => { await c.progress.emit({ event: "captured" }); return compiled; } },
    inspector: { inspect: async () => ({ fileCount: 1, totalBytes: 1, files: ["x"] }) },
  });
  const server = createCloneMcpServer(service);
  const [ct, st] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "1" });
  await Promise.all([server.connect(st), client.connect(ct)]);
  try {
    const progress: unknown[] = [];
    const ok = await client.callTool({ name: "clone_page", arguments: { source: "x", framework: "vite" } }, undefined, { onprogress: p => progress.push(p) });
    assert.equal(ok.isError, undefined);
    assert.equal(progress.length, 3);
    const bad = await client.callTool({ name: "clone_page", arguments: { source: "x", framework: "bad" } });
    assert.equal(bad.isError, true);
    assert.equal(called, 1);
  } finally { await Promise.all([client.close(), server.close()]); }
});
