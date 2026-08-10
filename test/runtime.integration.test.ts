import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CloneService } from "../src/cloneService.ts";
import { DirectCompilerAdapter } from "../src/compilerAdapter.ts";
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

test("direct adapter clones MHTML without API, DB, queue, or CLI child", { skip: existsSync(chromium.executablePath()) ? false : "no Chromium" }, async () => {
  const root = mkdtempSync(join(tmpdir(), "integration-"));
  try {
    const source = join(root, "page.mhtml"); writeFileSync(source, fixture());
    const service = new CloneService({
      policy: new LocalCloneInputPolicy({ inputRoot: root, outputRoot: root }),
      compiler: new DirectCompilerAdapter({ viewports: [1280], interactions: false, components: false, motion: false, breakpoints: false }),
      inspector: new FileSystemCloneResultInspector(),
    });
    const result = await service.clone({ source, outputDir: join(root, "out"), framework: "vite" });
    assert.equal(result.sourceUrl, "https://snapshot.example/stdio");
    assert.match(readFileSync(join(result.appDir, "src/page.tsx"), "utf8"), /Direct library clone/);
    assert.ok(result.files.includes("vite.config.ts"));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("packaged launcher speaks clean STDIO MCP", async () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["--experimental-strip-types", join(root, "src", "stdio.ts")],
    cwd: root,
    env: { ...process.env, DITTO_MCP_INPUT_ROOT: root, DITTO_MCP_OUTPUT_ROOT: root }, stderr: "ignore",
  });
  const client = new Client({ name: "stdio-test", version: "1" });
  await client.connect(transport);
  try { assert.deepEqual((await client.listTools()).tools.map(t => t.name), ["clone_page"]); }
  finally { await client.close(); }
});
