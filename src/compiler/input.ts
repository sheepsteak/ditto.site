import { closeSync, existsSync, fstatSync, openSync, readSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export type NormalizedCloneInput =
  | { kind: "url"; raw: string; navigationUrl: string; sourceUrl: string }
  | { kind: "mhtml"; raw: string; navigationUrl: string; sourceUrl: string; localPath: string };

const MHTML_EXTENSIONS = new Set([".mhtml", ".mht"]);
const HEADER_SCAN_BYTES = 1024 * 1024;

function httpUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export function sourceUrlFromMhtml(path: string): string {
  const fd = openSync(path, "r");
  try {
    const size = Math.min(fstatSync(fd).size, HEADER_SCAN_BYTES);
    const bytes = Buffer.alloc(size);
    const read = readSync(fd, bytes, 0, size, 0);
    const headers = bytes.subarray(0, read).toString("latin1").replace(/\r?\n[ \t]+/g, " ");
    const snapshot = /^Snapshot-Content-Location:\s*(\S.*?)\s*$/im.exec(headers)?.[1];
    const fromSnapshot = httpUrl(snapshot);
    if (fromSnapshot) return fromSnapshot;

    const locations = headers.matchAll(/^Content-Location:\s*(\S.*?)\s*$/gim);
    for (const match of locations) {
      const location = httpUrl(match[1]);
      if (location) return location;
    }
  } finally {
    closeSync(fd);
  }
  throw new Error("MHTML archive has no HTTP(S) Snapshot-Content-Location or Content-Location header");
}

export function normalizeCloneInput(rawInput: string): NormalizedCloneInput {
  const raw = rawInput.trim();
  if (!raw) throw new Error("clone input is required");

  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return { kind: "url", raw, navigationUrl: url.href, sourceUrl: url.href };
    }
    if (url.protocol !== "file:") {
      throw new Error(`unsupported input protocol ${url.protocol}; expected HTTP(S) URL or .mhtml/.mht file`);
    }
  } catch (error) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) throw error;
  }

  const localPath = raw.startsWith("file:") ? fileURLToPath(raw) : resolve(raw);
  if (!MHTML_EXTENSIONS.has(extname(localPath).toLowerCase())) {
    throw new Error("local clone input must be an .mhtml or .mht file");
  }
  if (!existsSync(localPath) || !statSync(localPath).isFile()) {
    throw new Error(`MHTML file not found: ${localPath}`);
  }
  return {
    kind: "mhtml",
    raw,
    localPath,
    navigationUrl: pathToFileURL(localPath).href,
    sourceUrl: sourceUrlFromMhtml(localPath),
  };
}

export function assertCloneInputMode(input: NormalizedCloneInput, mode: "single" | "multi"): void {
  if (input.kind === "mhtml" && mode === "multi") {
    throw new Error("MHTML archives are single-page snapshots; use --mode=single");
  }
}
