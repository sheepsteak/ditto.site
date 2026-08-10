#!/usr/bin/env node
import { tsImport } from "tsx/esm/api";
try {
  const { main } = await tsImport("../src/server.ts", import.meta.url);
  await main();
} catch (error) {
  process.stderr.write(`ditto STDIO MCP failed: ${String(error?.message ?? error)}\n`);
  process.exitCode = 1;
}
