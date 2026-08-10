import type {
  CloneCompiler, CloneInputPolicy, CloneProgressSink, CloneResultInspector, CloneToolRequest, CloneToolResult,
} from "./types.ts";

const NO_PROGRESS: CloneProgressSink = { emit: () => {} };
export type CloneServiceDeps = { policy: CloneInputPolicy; compiler: CloneCompiler; inspector: CloneResultInspector };

export class CloneService {
  private active = false;
  private readonly deps: CloneServiceDeps;

  constructor(deps: CloneServiceDeps) {
    this.deps = deps;
  }

  async clone(request: CloneToolRequest, context?: { signal?: AbortSignal; progress?: CloneProgressSink }): Promise<CloneToolResult> {
    if (this.active) throw new Error("another clone is already running");
    this.active = true;
    const signal = context?.signal ?? new AbortController().signal;
    const sink = context?.progress ?? NO_PROGRESS;
    const progress: CloneProgressSink = {
      emit: async (event) => {
        try { await sink.emit(event); } catch { /* advisory only */ }
      },
    };
    try {
      signal.throwIfAborted();
      const normalized = await this.deps.policy.normalize(request);
      await progress.emit({ event: "clone_started", source: normalized.source });
      const compiled = await this.deps.compiler.run(normalized, { signal, progress });
      const files = await this.deps.inspector.inspect(compiled.appDir);
      const result: CloneToolResult = { status: "succeeded", ...compiled, ...files };
      await progress.emit({ event: "clone_completed", fileCount: result.fileCount, totalBytes: result.totalBytes });
      return result;
    } finally {
      this.active = false;
    }
  }
}
