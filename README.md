# ditto STDIO MCP

Self-contained STDIO MCP server with an embedded deterministic website compiler.
`clone_page` accepts an HTTP(S) URL or local `.mhtml`/`.mht` path, blocks until
capture/generation finishes, and returns the generated app path and summary.

No HTTP API, database, queue, worker, or compiler CLI child.

## Install and run

```bash
npm ci
npm run install-browser
npm start
```

```json
{
  "mcpServers": {
    "ditto-local": {
      "command": "node",
      "args": ["/absolute/path/to/package/bin/ditto-mcp.mjs"],
      "env": {
        "DITTO_MCP_INPUT_ROOT": "/workspace",
        "DITTO_MCP_OUTPUT_ROOT": "/workspace"
      }
    }
  }
}
```

Tool input:

```json
{
  "source": "/workspace/input/page.mhtml",
  "outputDir": "/workspace/generated",
  "framework": "vite",
  "styling": "tailwind"
}
```

Allow a ten-minute MCP request timeout and reset it on progress notifications.
Run untrusted snapshots in an isolated, resource-limited container.

## Tests

```bash
npm run typecheck
npm run test:unit
npm run test:compiler
npm run test:integration
npm run test:pack
npm test
```

Coverage includes interface composition, path/symlink boundaries, progress,
locking, cancellation, MCP schema/errors, actual STDIO transport, Chromium MHTML
capture, CID assets, IR/CSS/Tailwind/assets/fonts/interactions/motion/SEO,
framework generation, and deterministic output.
