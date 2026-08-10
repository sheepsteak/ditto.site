#!/usr/bin/env node

import { main } from "./server.ts";

try {
  await main();
} catch (error) {
  process.stderr.write(`ditto STDIO MCP failed: ${String(error instanceof Error ? error.message : error)}\n`);
  process.exitCode = 1;
}
