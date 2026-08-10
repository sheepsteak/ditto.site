import { realpath, stat } from "node:fs/promises";
import { extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CloneInputPolicy, CloneToolRequest, NormalizedCloneRequest } from "./types.ts";

function isWithin(root: string, candidate: string): boolean {
  const rel = relative(root, candidate);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

export type LocalCloneInputPolicyOptions = { inputRoot: string; outputRoot: string; defaultOutputDir?: string };

export class LocalCloneInputPolicy implements CloneInputPolicy {
  private readonly options: LocalCloneInputPolicyOptions;

  constructor(options: LocalCloneInputPolicyOptions) {
    this.options = options;
  }

  async normalize(request: CloneToolRequest): Promise<NormalizedCloneRequest> {
    const source = request.source?.trim();
    if (!source) throw new Error("source is required");
    const inputRoot = await realpath(this.options.inputRoot);
    const outputRoot = await realpath(this.options.outputRoot);
    const normalizedSource = await this.normalizeSource(source, inputRoot);
    const requestedOutput = request.outputDir?.trim()
      ? request.outputDir
      : this.options.defaultOutputDir ?? join(outputRoot, "ditto-output");
    const outputDir = resolve(isAbsolute(requestedOutput) ? requestedOutput : join(outputRoot, requestedOutput));
    if (!isWithin(outputRoot, outputDir)) throw new Error(`outputDir must stay within ${outputRoot}`);
    return {
      source: normalizedSource,
      outputDir,
      framework: request.framework ?? "next",
      styling: request.styling ?? "tailwind",
    };
  }

  private async normalizeSource(source: string, inputRoot: string): Promise<string> {
    try {
      const url = new URL(source);
      if (url.protocol === "http:" || url.protocol === "https:") return url.href;
      if (url.protocol !== "file:") throw new Error("source must be an HTTP(S) URL or local .mhtml/.mht file");
      source = fileURLToPath(url);
    } catch (error) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(source)) throw error;
    }
    const candidate = await realpath(resolve(source));
    if (!isWithin(inputRoot, candidate)) throw new Error(`source file must stay within ${inputRoot}`);
    if (![".mhtml", ".mht"].includes(extname(candidate).toLowerCase())) throw new Error("local source must end in .mhtml or .mht");
    if (!(await stat(candidate)).isFile()) throw new Error("source must be a file");
    return candidate;
  }
}
