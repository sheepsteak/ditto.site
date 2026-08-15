export type CloneFramework = "next" | "vite";
export type CloneStyling = "tailwind" | "css";
export type CloneToolRequest = { source: string; outputDir?: string; framework?: CloneFramework; styling?: CloneStyling };
export type NormalizedCloneRequest = { source: string; outputDir: string; framework: CloneFramework; styling: CloneStyling };
export type CloneProgressEvent = Record<string, unknown>;
export interface CloneProgressSink { emit(event: CloneProgressEvent): void | Promise<void> }
export type CompilerRunResult = {
  sourceUrl: string; runDir: string; sourceDir: string; appDir: string;
  nodeCount: number; missingAssets: number;
};
export type CloneFileSummary = { fileCount: number; totalBytes: number; files: string[] };
export type CloneToolResult = CompilerRunResult & CloneFileSummary & { status: "succeeded" };
export type CloneJobStatus = "running" | "cancelling" | "succeeded" | "failed" | "cancelled";
export type CloneJobEvent = {
  cursor: number;
  at: string;
  event: string;
  data: Record<string, unknown>;
};
export type CloneJobStart = { jobId: string; status: "running" };
export type CloneJobView = {
  jobId: string;
  status: CloneJobStatus;
  startedAt: string;
  completedAt?: string;
  cancellationRequested: boolean;
  events: CloneJobEvent[];
  nextCursor: number;
  hasMore: boolean;
  eventsTruncated: boolean;
  lastEvent?: CloneJobEvent;
  result?: CloneToolResult;
  error?: string;
};
export interface CloneExecutor {
  clone(
    request: CloneToolRequest,
    context?: { signal?: AbortSignal; progress?: CloneProgressSink },
  ): Promise<CloneToolResult>;
}
export interface CloneJobManager {
  start(request: CloneToolRequest, progress?: CloneProgressSink): CloneJobStart;
  status(jobId: string, options?: { after?: number; limit?: number }): CloneJobView | null;
  wait(jobId: string): Promise<CloneJobView | null>;
  cancel(jobId: string): CloneJobView | null;
}
export interface CloneInputPolicy { normalize(request: CloneToolRequest): Promise<NormalizedCloneRequest> }
export interface CloneCompiler {
  run(request: NormalizedCloneRequest, context: { signal: AbortSignal; progress: CloneProgressSink }): Promise<CompilerRunResult>;
}
export interface CloneResultInspector { inspect(appDir: string): Promise<CloneFileSummary> }
