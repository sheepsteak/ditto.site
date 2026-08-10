#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLocalCloneService } from "./composition.js";
import { createCloneMcpServer } from "./mcpServer.js";

export async function main(): Promise<void> {
  const service = createLocalCloneService({
    inputRoot: process.env.DITTO_MCP_INPUT_ROOT,
    outputRoot: process.env.DITTO_MCP_OUTPUT_ROOT,
    defaultOutputDir: process.env.DITTO_MCP_DEFAULT_OUTPUT_DIR,
  });
  await createCloneMcpServer(service).connect(new StdioServerTransport());
  process.stderr.write("ditto STDIO MCP ready\n");
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`ditto STDIO MCP failed: ${String((error as Error).message ?? error)}\n`);
    process.exitCode = 1;
  });
}
