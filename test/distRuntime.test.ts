import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("compiled package contains JavaScript, declarations, maps, and compiler data", async () => {
  for (const path of [
    "dist/index.js",
    "dist/index.d.ts",
    "dist/index.js.map",
    "dist/stdio.js",
    "dist/compiler/data/pattern-catalog.json",
    "dist/compiler/data/pattern-catalog.lock",
  ]) {
    assert.equal(existsSync(join(root, path)), true, `${path} must exist`);
  }

  const exports = await import(pathToFileURL(join(root, "dist", "index.js")).href);
  assert.equal(typeof exports.CloneService, "function");
  assert.equal(typeof exports.createCloneMcpServer, "function");
});

test("compiled STDIO server speaks MCP without a TypeScript loader", async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(root, "dist", "stdio.js")],
    cwd: root,
    env: {
      ...process.env,
      DITTO_MCP_INPUT_ROOT: root,
      DITTO_MCP_OUTPUT_ROOT: root,
    },
    stderr: "ignore",
  });
  const client = new Client({ name: "dist-runtime-test", version: "1.0.0" });
  await client.connect(transport);
  try {
    assert.deepEqual((await client.listTools()).tools.map((tool) => tool.name), ["clone_page"]);
  } finally {
    await client.close();
  }
});
