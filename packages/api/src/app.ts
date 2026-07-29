import { randomBytes } from "node:crypto";
import { Hono, type Context, type MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { RESPONSE_ALREADY_SENT } from "@hono/node-server/utils/response";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createMhtmlSource, normalizeCloneRequestOptions, type CloneOptions, type CloneSource } from "@cloner/core";
import type { Backend } from "./backend.js";
import { createMcpServer } from "./mcp.js";
import { apiKeyAuth, hashApiKey, rateLimit, type AuthConfig } from "./auth.js";

const OptionsSchema = z
  .object({
    mode: z.enum(["single", "multi"]).optional(),
    styling: z.enum(["tailwind", "css"]).optional(),
    framework: z.enum(["next", "vite"]).optional(),
    preview: z.boolean().optional(),
    verify: z.boolean().optional(),
    asyncVerify: z.boolean().optional(),
    maxRoutes: z.number().int().positive().optional(),
    maxCollection: z.number().int().positive().optional(),
    captureConcurrency: z.number().int().positive().optional(),
    validationConcurrency: z.number().int().positive().optional(),
    viewportConcurrency: z.number().int().positive().optional(),
    experimentalContentHandoff: z.literal("ion-cms-v1").optional(),

    // Deprecated compatibility aliases and dev-only escape hatches.
    multiPage: z.boolean().optional(),
    humanizeMode: z.enum(["tailwind", "css"]).optional(),
    viewports: z.array(z.number().int().positive()).min(1).optional(),
    interactions: z.boolean().optional(),
    components: z.boolean().optional(),
    motion: z.boolean().optional(),
    noCache: z.boolean().optional(),
  })
  .strict()
  .superRefine((options, ctx) => {
    const mode = options.mode ?? (options.multiPage ? "multi" : "single");
    if (options.experimentalContentHandoff && mode !== "multi") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["experimentalContentHandoff"],
        message: "experimentalContentHandoff is available only for multi-page clones",
      });
    }
    if (options.experimentalContentHandoff && options.framework === "vite") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["experimentalContentHandoff"],
        message: "experimentalContentHandoff currently requires the Next.js framework",
      });
    }
  });

const CloneRequest = z.object({
  url: z.string().url(),
  options: OptionsSchema.optional(),
});

const SignupRequest = z
  .object({
    email: z.string().email().max(320).transform((s) => s.trim().toLowerCase()),
    label: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

const SignupVerifyRequest = z
  .object({
    token: z.string().min(24).max(256),
  })
  .strict();

export type SignupDeps = {
  createApiKey: (input: { keyHash: string; label: string; rateLimit?: number }) => Promise<void>;
  defaultRateLimit?: number;
  rateLimitPerHour?: number;
  directEnabled?: boolean;
  email?: {
    createToken: (input: { email: string; tokenHash: string; expiresAt: Date }) => Promise<void>;
    consumeToken: (tokenHash: string) => Promise<{ email: string } | undefined>;
    sendVerificationEmail: (input: { email: string; verifyUrl: string; expiresAt: Date }) => Promise<void>;
    verifyUrl: string;
    tokenTtlMs: number;
  };
};

export type AppDeps = {
  backend: Backend;
  /** Maximum uploaded MHTML size. Defaults to 25 MiB. */
  maxMhtmlBytes?: number;
  /** absolute base URL used in MCP-returned references (binary/bundle URLs). */
  baseUrl?: string;
  /** mount the MCP Streamable-HTTP endpoint at /mcp (default true). */
  mcp?: boolean;
  /** require an API key on /v1/* and /mcp (omit = open). */
  auth?: AuthConfig;
  /** per-window request cap on /v1/* and /mcp (omit = unlimited). */
  rateLimitPerMinute?: number;
  /** public key minting endpoint at POST /v1/signup (omit = disabled). */
  signup?: SignupDeps;
  /** browser origins allowed to call public signup routes. */
  signupCorsOrigins?: string[];
  /** SSRF guard run on submit (omit = no check — set in production). Throws to reject. */
  assertUrl?: (url: string) => Promise<void>;
};

/** Build the Hono app over a Backend. The in-memory backend (M1) runs clones inline
 *  (POST → 200 + file map); the DB backend (M2) enqueues (POST → 202) and the worker
 *  fills the result (poll via GET). The HTTP surface is identical either way. */
export function createApp(deps: AppDeps): Hono {
  const { backend } = deps;
  const app = new Hono();
  const signupCorsOrigins = deps.signupCorsOrigins ?? [];

  if (signupCorsOrigins.length > 0) {
    const allowedOrigins = new Set(signupCorsOrigins);
    const signupCors = cors({
      origin: (origin) => (allowedOrigins.has(origin) ? origin : null),
      allowMethods: ["POST", "OPTIONS"],
      allowHeaders: ["content-type"],
      maxAge: 86400,
    });
    app.use("/v1/signup", signupCors);
    app.use("/v1/signup/*", signupCors);
  }

  app.get("/healthz", (c) => c.json({ ok: true }));

  if (deps.signup) {
    const signup = deps.signup;
    const signupRateLimit = signup.rateLimitPerHour ?? 3;
    const signupLimiter = rateLimit({ perMinute: signupRateLimit, windowMs: 60 * 60 * 1000 });
    const mintKey = async (email: string, label?: string) => {
      const apiKey = `dtto_live_${randomBytes(32).toString("base64url")}`;
      const storedLabel = label ? `${email} (${label})` : email;
      await signup.createApiKey({
        keyHash: hashApiKey(apiKey),
        label: storedLabel,
        rateLimit: signup.defaultRateLimit,
      });
      return apiKey;
    };

    const directSignupHandler = async (c: Context) => {
      const body = await c.req.json().catch(() => null);
      const parsed = SignupRequest.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: "invalid request", details: parsed.error.flatten() }, 400);
      }
      const apiKey = await mintKey(parsed.data.email, parsed.data.label);
      return c.json(
        {
          apiKey,
          message: "Save this key now; it will not be shown again.",
        },
        201,
      );
    };

    if (signup.directEnabled !== false) {
      if (signupRateLimit > 0) app.post("/v1/signup", signupLimiter, directSignupHandler);
      else app.post("/v1/signup", directSignupHandler);
    }

    const emailSignup = signup.email;
    if (emailSignup) {
      const requestSignupHandler = async (c: Context) => {
        const body = await c.req.json().catch(() => null);
        const parsed = SignupRequest.safeParse(body);
        if (!parsed.success) {
          return c.json({ error: "invalid request", details: parsed.error.flatten() }, 400);
        }
        const rawToken = `dtto_signup_${randomBytes(32).toString("base64url")}`;
        const expiresAt = new Date(Date.now() + emailSignup.tokenTtlMs);
        const url = new URL(emailSignup.verifyUrl);
        url.searchParams.set("token", rawToken);
        await emailSignup.createToken({
          email: parsed.data.email,
          tokenHash: hashApiKey(rawToken),
          expiresAt,
        });
        await emailSignup.sendVerificationEmail({
          email: parsed.data.email,
          verifyUrl: url.toString(),
          expiresAt,
        });
        return c.json({ message: "Check your email for a verification link." }, 202);
      };

      const verifySignupHandler = async (c: Context) => {
        const body = await c.req.json().catch(() => null);
        const parsed = SignupVerifyRequest.safeParse(body);
        if (!parsed.success) {
          return c.json({ error: "invalid request", details: parsed.error.flatten() }, 400);
        }
        const token = await emailSignup.consumeToken(hashApiKey(parsed.data.token));
        if (!token) {
          return c.json({ error: "invalid or expired signup token" }, 400);
        }
        const apiKey = await mintKey(token.email);
        return c.json(
          {
            apiKey,
            message: "Save this key now; it will not be shown again.",
          },
          201,
        );
      };

      if (signupRateLimit > 0) app.post("/v1/signup/request", signupLimiter, requestSignupHandler);
      else app.post("/v1/signup/request", requestSignupHandler);
      app.post("/v1/signup/verify", verifySignupHandler);
    }
  }

  const skipSignup = (mw: MiddlewareHandler): MiddlewareHandler => {
    return async (c, next) => {
      if (c.req.path === "/v1/signup" || c.req.path === "/v1/signup/request" || c.req.path === "/v1/signup/verify") return next();
      return mw(c, next);
    };
  };

  // Protect the clone API + MCP surfaces (not /healthz or /v1/signup). Auth
  // before rate-limit so the limiter can key by API key.
  if (deps.auth) {
    const mw = apiKeyAuth(deps.auth);
    app.use("/v1/*", skipSignup(mw));
    app.use("/mcp", mw);
  }
  if (deps.rateLimitPerMinute && deps.rateLimitPerMinute > 0) {
    const mw = rateLimit({ perMinute: deps.rateLimitPerMinute });
    app.use("/v1/*", skipSignup(mw));
    app.use("/mcp", mw);
  }

  app.post("/v1/clones", async (c) => {
    let source: CloneSource;
    let options: CloneOptions | undefined;
    const contentType = c.req.header("content-type") ?? "";
    if (contentType.toLowerCase().includes("multipart/form-data")) {
      const form = await c.req.formData().catch(() => null);
      const file = form?.get("file");
      if (!file || typeof file === "string") return c.json({ error: "multipart field 'file' is required" }, 400);
      const maxBytes = deps.maxMhtmlBytes ?? 25 * 1024 * 1024;
      if (file.size > maxBytes) return c.json({ error: `MHTML file exceeds ${maxBytes} byte limit` }, 413);
      const rawOptions = form?.get("options");
      let parsedOptions: unknown = {};
      if (typeof rawOptions === "string" && rawOptions.trim()) {
        try {
          parsedOptions = JSON.parse(rawOptions);
        } catch {
          return c.json({ error: "multipart 'options' must be valid JSON" }, 400);
        }
      }
      const checkedOptions = OptionsSchema.safeParse(parsedOptions);
      if (!checkedOptions.success) {
        return c.json({ error: "invalid options", details: checkedOptions.error.flatten() }, 400);
      }
      try {
        source = createMhtmlSource(Buffer.from(await file.arrayBuffer()), file.name || "snapshot.mhtml");
      } catch (error) {
        return c.json({ error: String((error as Error).message ?? error) }, 400);
      }
      options = checkedOptions.data;
    } else {
      const body = await c.req.json().catch(() => null);
      const parsed = CloneRequest.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: "invalid request", details: parsed.error.flatten() }, 400);
      }
      const { url } = parsed.data;
      options = parsed.data.options;
      if (!/^https?:\/\//i.test(url)) return c.json({ error: "url must be http(s)" }, 400);
      if (deps.assertUrl) {
        try {
          await deps.assertUrl(url);
        } catch (e) {
          return c.json({ error: "url not allowed", reason: String((e as Error).message ?? e) }, 400);
        }
      }
      source = { kind: "url", url };
    }
    // Header alias for the per-request cache bypass.
    const noCacheHeader = (c.req.header("cache-control") ?? "").toLowerCase().includes("no-cache");
    const normalizedOptions = normalizeCloneRequestOptions(options ?? {});
    if (source.kind === "mhtml" && normalizedOptions.mode === "multi") {
      return c.json({ error: "MHTML archives are single-page snapshots; use mode=single" }, 400);
    }
    const opts = noCacheHeader ? { ...normalizedOptions, noCache: true } : normalizedOptions;

    try {
      const out = await backend.submit(source, opts);
      if (out.status === "queued") return c.json({ jobId: out.jobId, status: "queued" }, out.httpStatus);
      return c.json(out.result, 200);
    } catch (e) {
      const msg = String(e);
      if (msg.startsWith("BUSY:")) return c.json({ error: msg.slice(5).trim() }, 429);
      return c.json({ status: "failed", error: msg.slice(0, 500) }, 500);
    }
  });

  app.get("/v1/clones", async (c) => {
    return c.json({ clones: await backend.list() });
  });

  app.get("/v1/clones/:id", async (c) => {
    const view = await backend.status(c.req.param("id"));
    if (!view) return c.json({ error: "not found" }, 404);
    return c.json(view, 200);
  });

  app.get("/v1/clones/:id/result", async (c) => {
    const out = await backend.result(c.req.param("id"));
    if (!out) return c.json({ error: "not found" }, 404);
    if (!out.ready) return c.json({ jobId: c.req.param("id"), status: out.status, error: out.error }, 409);
    return c.json(out.result, 200);
  });

  app.get("/v1/clones/:id/bundle", async (c) => {
    const fmt = c.req.query("format") === "zip" ? "zip" : "tgz";
    const b = await backend.bundle(c.req.param("id"), fmt);
    if (!b) return c.json({ error: "not found or not ready" }, 404);
    if (b.url) return c.redirect(b.url, 302); // S3: hand off to the presigned URL
    c.header("content-type", fmt === "zip" ? "application/zip" : "application/gzip");
    c.header("content-disposition", `attachment; filename="clone-${c.req.param("id")}.${fmt}"`);
    c.header("content-length", String(b.bytes.length));
    c.header("x-content-sha256", b.sha256);
    return c.body(b.bytes);
  });

  app.get("/v1/clones/:id/files/:path{.+}", async (c) => {
    const file = await backend.file(c.req.param("id"), c.req.param("path"));
    if (!file) return c.json({ error: "file not found" }, 404);
    c.header("content-type", file.contentType);
    c.header("content-length", String(file.bytes.length));
    return c.body(file.bytes);
  });

  // Pipeline progress events (poll every ~300ms while a clone runs).
  app.get("/v1/clones/:id/events", async (c) => {
    const after = Math.max(0, Number(c.req.query("after") ?? "0") || 0);
    const events = backend.events ? await backend.events(c.req.param("id"), after) : null;
    if (!events) return c.json({ error: "not found" }, 404);
    return c.json({ jobId: c.req.param("id"), events });
  });

  // Browsable preview of the built clone (static export published by the preview
  // build under public/app-preview/). References are relative, so the export works
  // from this mount — the only requirement is a trailing slash on the root.
  const previewFile = async (c: Context, sub: string) => {
    const id = c.req.param("id") ?? "";
    const tryPaths = sub.includes(".")
      ? [`public/app-preview/${sub}`]
      : [
          `public/app-preview/${sub}`.replace(/\/$/, "") + "/index.html",
          `public/app-preview/${sub}`,
          `public/app-preview/${sub}.html`,
        ];
    for (const p of tryPaths) {
      const file = await backend.file(id, p);
      if (file) {
        c.header("content-type", file.contentType);
        c.header("content-length", String(file.bytes.length));
        return c.body(file.bytes);
      }
    }
    return c.json({ error: "no app preview for this clone (preview builds are on by default for single-page clones; pass options.preview=true otherwise)" }, 404);
  };
  app.get("/v1/clones/:id/app-preview", (c) => c.redirect(`/v1/clones/${c.req.param("id")}/app-preview/`, 302));
  app.get("/v1/clones/:id/app-preview/", (c) => previewFile(c, "index.html"));
  app.get("/v1/clones/:id/app-preview/:path{.+}", (c) => previewFile(c, c.req.param("path") ?? ""));

  app.delete("/v1/clones/:id", async (c) => {
    const ok = await backend.remove(c.req.param("id"));
    return c.json({ deleted: ok }, ok ? 200 : 404);
  });

  // MCP over Streamable-HTTP (stateless): a fresh server+transport per request.
  // Requires the Node http req/res from @hono/node-server (not available under
  // app.request — MCP is exercised in tests via the in-memory transport instead).
  if (deps.mcp !== false) {
    app.all("/mcp", async (c) => {
      const env = c.env as { incoming?: IncomingMessage; outgoing?: ServerResponse };
      if (!env?.incoming || !env?.outgoing) {
        return c.json({ error: "MCP requires the Node HTTP server (run via @hono/node-server)" }, 501);
      }
      const server = createMcpServer(backend, { baseUrl: deps.baseUrl, maxMhtmlBytes: deps.maxMhtmlBytes });
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      env.outgoing.on("close", () => {
        transport.close();
        server.close();
      });
      await server.connect(transport);
      const body = c.req.method === "POST" ? await c.req.json().catch(() => undefined) : undefined;
      await transport.handleRequest(env.incoming, env.outgoing, body);
      return RESPONSE_ALREADY_SENT;
    });
  }

  return app;
}
