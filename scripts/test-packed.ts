import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const root = process.cwd();
const work = mkdtempSync(join(tmpdir(), "ditto-packed-test-"));

try {
  execFileSync("npm", ["pack", "--pack-destination", work], {
    cwd: root,
    stdio: "ignore",
  });
  const archive = readdirSync(work).find((name) => name.endsWith(".tgz"));
  if (!archive) throw new Error("npm pack did not produce an archive");

  const consumer = join(work, "consumer");
  mkdirSync(consumer);
  writeFileSync(join(consumer, "package.json"), '{"name":"packed-test","private":true,"type":"module"}\n');
  execFileSync("npm", ["install", join(work, archive), "--ignore-scripts", "--no-audit", "--no-fund"], {
    cwd: consumer,
    stdio: "ignore",
  });

  const server = join(consumer, "node_modules", "@cloner", "mcp-stdio", "dist", "stdio.js");
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [server],
    cwd: consumer,
    env: {
      ...process.env,
      DITTO_MCP_INPUT_ROOT: consumer,
      DITTO_MCP_OUTPUT_ROOT: consumer,
    },
    stderr: "ignore",
  });
  const client = new Client({ name: "packed-runtime-test", version: "1.0.0" });
  await client.connect(transport);
  try {
    const names = (await client.listTools()).tools.map((tool) => tool.name);
    if (JSON.stringify(names) !== JSON.stringify(["clone_page", "get_clone_status", "cancel_clone"])) {
      throw new Error(`unexpected packed tools: ${JSON.stringify(names)}`);
    }
  } finally {
    await client.close();
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
