import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CloneService } from "./cloneService.js";
import type { CloneProgressSink } from "./types.js";

export function createCloneMcpServer(service: CloneService): McpServer {
  const server = new McpServer({ name: "ditto-stdio", version: "0.1.0" });
  server.registerTool("clone_page", {
    title: "Clone page",
    description: "Clone an HTTP(S) URL or local .mhtml/.mht file. The call blocks until generation completes.",
    inputSchema: {
      source: z.string().min(1),
      outputDir: z.string().min(1).optional(),
      framework: z.enum(["next", "vite"]).optional(),
      styling: z.enum(["tailwind", "css"]).optional(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  }, async (input, extra) => {
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
    try {
      const result = await service.clone(input, { signal: extra.signal, progress });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      const message = String((error as Error).message ?? error).slice(0, 1000);
      return { isError: true, content: [{ type: "text" as const, text: JSON.stringify({ status: "failed", error: message }, null, 2) }] };
    }
  });
  return server;
}
