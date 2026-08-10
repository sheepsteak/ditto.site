# ditto STDIO MCP

Self-contained STDIO MCP server with an embedded deterministic website compiler.
`clone_page` accepts an HTTP(S) URL or local `.mhtml`/`.mht` path, blocks until
capture/generation finishes, and returns the generated app path and summary.

No HTTP API, database, queue, worker, or compiler CLI child.
Source stays as TypeScript. Production builds transpile ESM, declarations, and
source maps into `dist`; runtime uses plain Node with no TypeScript loader.
Development runs source directly through `tsx`.

## Install and run

```bash
npm ci
npm run install-browser
npm run build
npm start
```

For development:

```bash
npm run dev
```

```json
{
  "mcpServers": {
    "ditto-local": {
      "command": "node",
      "args": ["/absolute/path/to/package/dist/stdio.js"],
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
npm run test:dist
npm run test:packed
npm run test:pack
npm test
```

Coverage includes interface composition, path/symlink boundaries, progress,
locking, cancellation, MCP schema/errors, actual STDIO transport, Chromium MHTML
capture, CID assets, IR/CSS/Tailwind/assets/fonts/interactions/motion/SEO,
framework generation, deterministic output, compiled runtime exports, and an
installed npm-tarball MCP smoke test.

## Layout

- `src/compiler/`: embedded compiler code and pinned pattern data.
- `src/`: MCP service, interfaces, policies, and composition.
- `dist/`: compiled JavaScript, declarations, source maps, and copied compiler data.
- `scripts/`: TypeScript build helpers.
- `test/compiler/`: compiler regression tests.
- `test/fixtures/`: browser-capture fixtures.
- `test/`: MCP unit and integration tests.
