import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { captureSite } from "../../src/compiler/capture/capture.ts";

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "..", "fixtures");

test("settles a late top-level navigation before page evaluation", { timeout: 60_000 }, async () => {
  const html = readFileSync(join(FIXTURES, "late-navigation.html"), "utf8");
  let navigationRequests = 0;
  const server = createServer((req, res) => {
    const pathname = new URL(req.url ?? "/", "http://fixture.test").pathname;
    if (pathname !== "/late-navigation") {
      res.writeHead(404).end();
      return;
    }
    navigationRequests++;
    res.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    });
    res.end(html);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

  const address = server.address();
  assert.ok(address && typeof address === "object");
  const url = `http://127.0.0.1:${address.port}/late-navigation`;
  const outDir = mkdtempSync(join(tmpdir(), "ditto-late-navigation-"));
  const events: Array<Record<string, unknown>> = [];

  try {
    const capture = await captureSite({
      url,
      outDir,
      viewports: [1280],
      motion: true,
      breakpoints: false,
      screenshots: false,
      log: (event) => events.push(event),
    });

    assert.ok(navigationRequests > 1, `fixture should navigate after goto (requests: ${navigationRequests})`);
    assert.ok(events.some((event) => event.event === "late_navigation_settle"));
    assert.equal(capture.perViewport.length, 1);
    assert.ok(capture.perViewport[0]!.nodeCount > 0);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    rmSync(outDir, { recursive: true, force: true });
  }
});
