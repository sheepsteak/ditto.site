import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CloneService } from "../src/cloneService.ts";
import { DirectCompilerAdapter } from "../src/compilerAdapter.ts";
import { InMemoryCloneJobManager } from "../src/jobManager.ts";
import { createCloneMcpServer } from "../src/mcpServer.ts";
import { LocalCloneInputPolicy } from "../src/pathPolicy.ts";
import { FileSystemCloneResultInspector } from "../src/resultInspector.ts";

function fixture(): Buffer {
  const b = "----Boundary--stdio";
  return Buffer.from([
    "From: <Saved by Blink>", "Snapshot-Content-Location: https://snapshot.example/stdio",
    "MIME-Version: 1.0", `Content-Type: multipart/related; boundary="${b}"`, "",
    `--${b}`, "Content-Type: text/html", "Content-Location: https://snapshot.example/stdio", "",
    "<!doctype html><html><head><title>STDIO</title></head><body><h1>Direct library clone</h1></body></html>",
    `--${b}--`, "",
  ].join("\r\n"));
}

function parseToolResult(result: unknown): Record<string, any> {
  const text = (result as { content?: Array<{ type: string; text?: string }> }).content?.[0]?.text;
  return JSON.parse(text ?? "{}");
}

test("MCP start and status tools clone MHTML end-to-end", { skip: existsSync(chromium.executablePath()) ? false : "no Chromium" }, async () => {
  const root = mkdtempSync(join(tmpdir(), "integration-"));
  let client: Client | undefined;
  let server: ReturnType<typeof createCloneMcpServer> | undefined;
  try {
    const source = join(root, "page.mhtml"); writeFileSync(source, fixture());
    const service = new CloneService({
      policy: new LocalCloneInputPolicy({ inputRoot: root, outputRoot: root }),
      compiler: new DirectCompilerAdapter({ viewports: [1280], interactions: false, components: false, motion: false, breakpoints: false }),
      inspector: new FileSystemCloneResultInspector(),
    });
    server = createCloneMcpServer(new InMemoryCloneJobManager(service, { createId: () => "real-mhtml-job" }));
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    client = new Client({ name: "integration", version: "1" });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const started = parseToolResult(await client.callTool({
      name: "clone_page",
      arguments: { source, outputDir: join(root, "out"), framework: "vite" },
    }));
    assert.deepEqual(started, { jobId: "real-mhtml-job", status: "running", pollAfterMs: 2000 });

    let cursor = 0;
    let status: Record<string, any> = {};
    const progressEvents: string[] = [];
    for (let attempt = 0; attempt < 1_200 && status.status !== "succeeded"; attempt++) {
      status = parseToolResult(await client.callTool({
        name: "get_clone_status",
        arguments: { jobId: started.jobId, after: cursor },
      }));
      progressEvents.push(...status.events.map((event: { event: string }) => event.event));
      cursor = status.nextCursor;
      if (status.status === "failed" || status.status === "cancelled") {
        assert.fail(`clone ended as ${status.status}: ${status.error}`);
      }
      if (status.status !== "succeeded") await new Promise((resolve) => setTimeout(resolve, 25));
    }
    assert.equal(status.status, "succeeded");
    while (status.hasMore) {
      status = parseToolResult(await client.callTool({
        name: "get_clone_status",
        arguments: { jobId: started.jobId, after: cursor },
      }));
      progressEvents.push(...status.events.map((event: { event: string }) => event.event));
      cursor = status.nextCursor;
    }
    assert.ok(progressEvents.includes("goto"));
    assert.ok(progressEvents.includes("job_succeeded"));

    const result = status.result;
    assert.equal(result.sourceUrl, "https://snapshot.example/stdio");
    assert.match(readFileSync(join(result.appDir, "src/page.tsx"), "utf8"), /Direct library clone/);
    assert.ok(result.files.includes("vite.config.ts"));
  } finally {
    if (client && server) await Promise.all([client.close(), server.close()]);
    rmSync(root, { recursive: true, force: true });
  }
});

test("packaged launcher speaks clean STDIO MCP", async () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["--import", "tsx", join(root, "src", "stdio.ts")],
    cwd: root,
    env: { ...process.env, DITTO_MCP_INPUT_ROOT: root, DITTO_MCP_OUTPUT_ROOT: root }, stderr: "ignore",
  });
  const client = new Client({ name: "stdio-test", version: "1" });
  await client.connect(transport);
  try {
    assert.deepEqual(
      (await client.listTools()).tools.map(t => t.name),
      ["clone_page", "get_clone_status", "cancel_clone"],
    );
  }
  finally { await client.close(); }
});
