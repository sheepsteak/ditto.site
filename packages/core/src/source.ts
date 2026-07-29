import { createHash } from "node:crypto";
import { basename, extname } from "node:path";
import type { CloneSource } from "./types.js";

export function createMhtmlSource(content: Buffer, filename = "snapshot.mhtml"): CloneSource & { kind: "mhtml" } {
  const safeFilename = basename(filename.trim() || "snapshot.mhtml");
  if (![".mhtml", ".mht"].includes(extname(safeFilename).toLowerCase())) {
    throw new Error("MHTML filename must end in .mhtml or .mht");
  }
  if (content.length === 0) throw new Error("MHTML file is empty");
  const prefix = content.subarray(0, Math.min(content.length, 64 * 1024)).toString("latin1");
  if (!/^Content-Type:\s*multipart\/related\b/im.test(prefix)) {
    throw new Error("file is not an MHTML multipart/related archive");
  }
  return {
    kind: "mhtml",
    content,
    filename: safeFilename,
    sha256: createHash("sha256").update(content).digest("hex"),
  };
}

export function cloneSourceLabel(source: CloneSource): string {
  return source.kind === "url" ? source.url : `mhtml:${source.filename}`;
}

export function cloneSourceIdentity(source: CloneSource): string {
  return source.kind === "url" ? `url:${source.url}` : `mhtml:${source.sha256}`;
}
