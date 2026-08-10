import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { assertCloneInputMode, normalizeCloneInput, sourceUrlFromMhtml } from "../../src/compiler/input.ts";

const archive = (headers: string[]) => [
  "From: <Saved by Blink>", ...headers, "MIME-Version: 1.0",
  'Content-Type: multipart/related; boundary="x"', "", "--x--", "",
].join("\r\n");

test("MHTML input supports path, file URL, .mht, folded and fallback locations", () => {
  const root = mkdtempSync(join(tmpdir(), "mhtml-input-"));
  try {
    const path = join(root, "PAGE.MHT");
    writeFileSync(path, archive(["Snapshot-Content-Location:", "\thttps://example.com/folded"]));
    const input = normalizeCloneInput(pathToFileURL(path).href);
    assert.equal(input.kind, "mhtml");
    assert.equal(input.sourceUrl, "https://example.com/folded");
    assert.throws(() => assertCloneInputMode(input, "multi"), /single-page/);
    const fallback = join(root, "fallback.mhtml");
    writeFileSync(fallback, archive(["Content-Location: https://example.com/fallback"]));
    assert.equal(sourceUrlFromMhtml(fallback), "https://example.com/fallback");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("MHTML input rejects malformed inputs", () => {
  const root = mkdtempSync(join(tmpdir(), "mhtml-input-"));
  try {
    const path = join(root, "bad.mhtml"); writeFileSync(path, archive([]));
    assert.throws(() => normalizeCloneInput(path), /no HTTP\(S\)/);
    assert.throws(() => normalizeCloneInput(join(root, "missing.mhtml")), /not found/);
    assert.throws(() => normalizeCloneInput("ftp://example.com/x.mhtml"), /unsupported input protocol/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
