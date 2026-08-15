import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CloneJobManager, CloneProgressSink, CloneToolRequest } from "./types.ts";

export type CloneMcpServerOptions = { waitByDefault?: boolean; pollAfterMs?: number };

const json = (data: unknown, isError = false) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  ...(isError ? { isError: true } : {}),
});

export function createCloneMcpServer(jobs: CloneJobManager, options: CloneMcpServerOptions = {}): McpServer {
  const waitByDefault = options.waitByDefault ?? false;
  const pollAfterMs = Math.max(250, Math.floor(options.pollAfterMs ?? 2_000));
  const server = new McpServer({ name: "ditto-stdio", version: "0.1.0" });
  server.registerTool("clone_page", {
    title: "Clone page",
    description: "Start cloning an HTTP(S) URL or local .mhtml/.mht file. Returns a jobId immediately by default; call get_clone_status every few seconds until terminal. Only one clone can run at once. Set wait=true for a blocking call.",
    inputSchema: {
      source: z.string().min(1),
      outputDir: z.string().min(1).optional(),
      framework: z.enum(["next", "vite"]).optional(),
      styling: z.enum(["tailwind", "css"]).optional(),
      wait: z.boolean().optional(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  }, async (input, extra) => {
    const wait = input.wait ?? waitByDefault;
    let value = 0;
    const token = extra._meta?.progressToken;
    const progress: CloneProgressSink = {
      emit: async (event) => {
        if (token === undefined) return;
        await extra.sendNotification({
          method: "notifications/progress",
          params: {
            progressToken: token,
            progress: ++value,
            message: typeof event.event === "string" ? event.event : "clone_progress",
          },
        });
      },
    };
    const request: CloneToolRequest = {
      source: input.source,
      ...(input.outputDir ? { outputDir: input.outputDir } : {}),
      ...(input.framework ? { framework: input.framework } : {}),
      ...(input.styling ? { styling: input.styling } : {}),
    };
    try {
      extra.signal.throwIfAborted();
      const started = jobs.start(request, wait ? progress : undefined);
      if (!wait) return json({ ...started, pollAfterMs });

      const cancelOnRequestAbort = (): void => { jobs.cancel(started.jobId); };
      extra.signal.addEventListener("abort", cancelOnRequestAbort, { once: true });
      if (extra.signal.aborted) cancelOnRequestAbort();
      try {
        const completed = await jobs.wait(started.jobId);
        if (!completed) return json({ error: "clone job disappeared", jobId: started.jobId }, true);
        if (completed.status === "succeeded" && completed.result) return json(completed.result);
        return json({ jobId: completed.jobId, status: completed.status, error: completed.error }, true);
      } finally {
        extra.signal.removeEventListener("abort", cancelOnRequestAbort);
      }
    } catch (error) {
      const message = String((error as Error).message ?? error).slice(0, 1000);
      return json({ status: "failed", error: message }, true);
    }
  });

  server.registerTool("get_clone_status", {
    title: "Get clone status",
    description: "Get clone status, new progress events, and terminal result/error. Pass the previous nextCursor as after. Poll no faster than pollAfterMs from clone_page.",
    inputSchema: {
      jobId: z.string().min(1),
      after: z.number().int().nonnegative().optional(),
      limit: z.number().int().positive().max(100).optional(),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ jobId, after, limit }) => {
    const view = jobs.status(jobId, { after, limit });
    if (!view) return json({ error: "clone job not found", jobId }, true);
    return json(view);
  });

  server.registerTool("cancel_clone", {
    title: "Cancel clone",
    description: "Request cancellation of a running clone. Poll get_clone_status until status is cancelled. Calling this for a terminal job is harmless.",
    inputSchema: { jobId: z.string().min(1) },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ jobId }) => {
    const view = jobs.cancel(jobId);
    if (!view) return json({ error: "clone job not found", jobId }, true);
    return json({
      jobId: view.jobId,
      status: view.status,
      cancellationRequested: view.cancellationRequested,
    });
  });

  return server;
}
