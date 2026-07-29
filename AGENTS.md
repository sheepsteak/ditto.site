# AGENTS.md

## Cursor Cloud specific instructions

Product: `ditto.site` — a deterministic website compiler exposed as a REST + MCP
service. `POST` a public URL and it captures the rendered page with headless
Chromium (Playwright) and emits a Next.js/Vite app as a file map. Monorepo of npm
workspaces (`compiler`, `packages/*`), TypeScript run directly via `tsx` (no build
step for the services).

Standard commands live in `README.md`, `docs/SERVICE.md`, `CONTRIBUTING.md`, and
root `package.json` scripts (`dev:api`, `dev:worker`, `db:migrate`, `test`,
`typecheck`, `clone`, `unpack`). Prefer those; notes below only cover non-obvious
cloud caveats.

### Services and how to run them
- `npm run typecheck` and `npm test` — run across all workspaces. Tests self-gate:
  browser tests skip without Chromium; Postgres tests skip unless `TEST_DATABASE_URL`
  is set (or run at repo root with a throwaway local Postgres). There is no separate
  lint script — `typecheck` is the static check.
- API: `npm run dev:api` (port `8787`, `tsx watch`). `GET /healthz` is unauthenticated.
- Worker: `npm run dev:worker` — only needed in DB+queue mode; consumes the pg-boss
  queue. In in-memory mode the API runs clones itself and no worker is required.

### Two run modes (important)
- In-memory (no `DATABASE_URL`): API runs clones inline; no Postgres/worker needed.
  Fastest for a single-page demo.
- DB+queue (`DATABASE_URL` set): API enqueues, a separate worker processes jobs.
  Run `npm run db:migrate` first. This is production parity.

### Postgres (installed via apt, not Docker — Docker is not available here)
- Start the cluster (it does not auto-start on boot): `sudo pg_ctlcluster 16 main start`
- Connection string used everywhere: `postgresql://postgres:postgres@localhost:5432/ditto_site`
  (role `postgres`/`postgres`, db `ditto_site` are already provisioned).
- Set `TEST_DATABASE_URL` to that string to run the Postgres-gated tests.

### Auth gotcha (non-obvious)
- In DB+queue mode the API is authenticated even when `API_KEYS` is empty, so
  `POST /v1/clones` returns `{"error":"missing API key"}`. For local testing, start
  the API with `API_KEYS=<some_key>` and send `Authorization: Bearer <some_key>`.
  In-memory mode with empty `API_KEYS` is open.
- Cloning `localhost`/loopback targets requires `SSRF_ALLOW_LOOPBACK=true` (SSRF
  guard is on by default). Public URLs like `https://example.com` work without it.

### Other notes
- Chromium for Playwright and its system libs are already installed; the update
  script keeps the browser build in sync.
- The worker's verify path provisions a Next/Vite build harness on demand under
  `local-data/harness` and runs `npm install` inside `compiler/.harness` the first
  time — this can dirty `compiler/.harness/package-lock.json`; do not commit that.
- Artifacts default to local disk (`ARTIFACTS_DIR`, e.g. `./local-data/artifacts`)
  when `S3_BUCKET` is unset; MinIO/S3 is optional.
- Turn a clone result into a project on disk with `npm run unpack -- - <out-dir>`.
