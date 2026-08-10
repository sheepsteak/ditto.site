import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { captureSite } from "../../src/compiler/capture/capture.ts";
import { generateAll } from "../../src/compiler/generate/pipeline.ts";
import { assertCloneInputMode, normalizeCloneInput, sourceUrlFromMhtml } from "../../src/compiler/input.ts";
import { buildIR } from "../../src/compiler/normalize/ir.ts";

const SOURCE_URL = "https://snapshot.example/products/widget";

function mhtmlFixture(): Buffer {
  const boundary = "----MultipartBoundary--ditto";
  const html = [
    "<!doctype html>",
    '<html><head><meta charset="utf-8"><title>Saved page</title>',
    "<style>body{background:#fff}h1{color:rgb(12,34,56)}</style></head>",
    '<body><h1 id="title">Offline snapshot</h1><img id="pixel" src="cid:image@ditto" alt="pixel"></body></html>',
  ].join("");
  return Buffer.from([
    "From: <Saved by Blink>",
    `Snapshot-Content-Location: ${SOURCE_URL}`,
    "Subject: Saved page",
    "MIME-Version: 1.0",
    `Content-Type: multipart/related; type="text/html"; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/html",
    "Content-ID: <frame@ditto>",
    "Content-Transfer-Encoding: quoted-printable",
    `Content-Location: ${SOURCE_URL}`,
    "",
    html,
    `--${boundary}`,
    "Content-Type: image/png",
    "Content-Transfer-Encoding: base64",
    "Content-Location: cid:image@ditto",
    "Content-ID: <image@ditto>",
    "",
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    `--${boundary}--`,
    "",
  ].join("\r\n"), "latin1");
}

describe("MHTML clone input", () => {
  let root = "";
  let archive = "";

  before(() => {
    root = mkdtempSync(join(tmpdir(), "ditto-mhtml-"));
    archive = join(root, "saved page.mhtml");
    writeFileSync(archive, mhtmlFixture());
  });

  after(() => rmSync(root, { recursive: true, force: true }));

  it("normalizes a local archive into navigation and semantic URLs", () => {
    const input = normalizeCloneInput(archive);
    assert.equal(input.kind, "mhtml");
    assert.ok(input.navigationUrl.startsWith("file://"));
    assert.equal(input.sourceUrl, SOURCE_URL);
    assert.equal(sourceUrlFromMhtml(archive), SOURCE_URL);
    assert.throws(() => assertCloneInputMode(input, "multi"), /single-page snapshots/);
  });

  it("captures embedded CID assets and generates against the original URL", async () => {
    const input = normalizeCloneInput(archive);
    const sourceDir = join(root, "source");
    const capture = await captureSite({
      url: input.sourceUrl,
      navigationUrl: input.navigationUrl,
      offline: true,
      outDir: sourceDir,
      viewports: [1280],
      breakpoints: false,
      interactions: false,
      motion: true,
      screenshots: false,
    });
    assert.equal(capture.sourceUrl, SOURCE_URL);
    assert.deepEqual(capture.motion?.rotators, [], "offline motion capture completes without suspended page timers");
    assert.deepEqual(capture.motion?.marquees, [], "offline JS marquee sampling is skipped");
    const image = capture.assets.find((asset) => asset.url.startsWith("cid:image@ditto"));
    assert.ok(image, "embedded image discovered");
    assert.ok(image.storedAs, "embedded image bytes stored");

    const ir = buildIR(sourceDir, [1280]);
    assert.equal(ir.doc.sourceUrl, SOURCE_URL);
    assert.equal(ir.doc.title, "Saved page");

    const generatedDir = join(root, "generated");
    generateAll({
      sourceDir,
      capture,
      viewports: [1280],
      sampleViewports: [1280],
      url: SOURCE_URL,
      outDir: generatedDir,
    });
    const page = readFileSync(join(generatedDir, "app", "src", "app", "page.tsx"), "utf8");
    assert.match(page, /Offline snapshot/);
    assert.match(page, /\/assets\/cloned\//);
    assert.doesNotMatch(page, /file:\/\//);
  });
});
