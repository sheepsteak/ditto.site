import { readdir, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import type { CloneFileSummary, CloneResultInspector } from "./types.js";

export class FileSystemCloneResultInspector implements CloneResultInspector {
  async inspect(appDir: string): Promise<CloneFileSummary> {
    const files: string[] = [];
    let totalBytes = 0;
    const walk = async (dir: string): Promise<void> => {
      const entries = await readdir(dir, { withFileTypes: true });
      entries.sort((a, b) => a.name.localeCompare(b.name));
      for (const entry of entries) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) await walk(path);
        else if (entry.isFile()) {
          files.push(relative(appDir, path).split(sep).join("/"));
          totalBytes += (await stat(path)).size;
        }
      }
    };
    await walk(appDir);
    return { fileCount: files.length, totalBytes, files };
  }
}
