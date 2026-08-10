import { join } from "node:path";
import { runClone } from "./compiler/runClone.ts";
import { buildIR } from "./compiler/normalize/ir.ts";
import { readJSON } from "./compiler/util/fsx.ts";
import type { CaptureResult } from "./compiler/capture/capture.ts";
import type { CloneCompiler, CloneProgressSink, CompilerRunResult, NormalizedCloneRequest } from "./types.ts";

export type DirectCompilerAdapterOptions = {
  viewports?: number[]; interactions?: boolean; components?: boolean; motion?: boolean; breakpoints?: boolean;
};
function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) { const error = new Error("clone cancelled"); error.name = "AbortError"; throw error; }
}
export class DirectCompilerAdapter implements CloneCompiler {
  private readonly options: DirectCompilerAdapterOptions;

  constructor(options: DirectCompilerAdapterOptions = {}) {
    this.options = options;
  }
  async run(request: NormalizedCloneRequest, context: { signal: AbortSignal; progress: CloneProgressSink }): Promise<CompilerRunResult> {
    throwIfAborted(context.signal);
    const result = await runClone({
      url: request.source,
      outDir: request.outputDir,
      framework: request.framework,
      humanizeMode: request.styling,
      viewports: this.options.viewports,
      interactions: this.options.interactions ?? true,
      components: this.options.components ?? true,
      motion: this.options.motion ?? true,
      breakpoints: this.options.breakpoints,
      reflow: true,
      screenshots: false,
      respectRobots: true,
      signal: context.signal,
      log: (event) => { void Promise.resolve(context.progress.emit(event)).catch(() => {}); },
    });
    throwIfAborted(context.signal);
    const capture = readJSON<CaptureResult>(join(result.sourceDir, "capture", "capture-result.json"));
    return {
      sourceUrl: result.sourceUrl,
      runDir: result.runDir,
      sourceDir: result.sourceDir,
      appDir: result.appDir,
      nodeCount: buildIR(result.sourceDir, capture.viewports).doc.nodeCount,
      missingAssets: result.visualAssetsMissing ?? 0,
    };
  }
}
