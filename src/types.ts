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
export interface CloneInputPolicy { normalize(request: CloneToolRequest): Promise<NormalizedCloneRequest> }
export interface CloneCompiler {
  run(request: NormalizedCloneRequest, context: { signal: AbortSignal; progress: CloneProgressSink }): Promise<CompilerRunResult>;
}
export interface CloneResultInspector { inspect(appDir: string): Promise<CloneFileSummary> }
