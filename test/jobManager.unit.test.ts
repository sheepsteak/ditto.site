import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryCloneJobManager } from "../src/jobManager.ts";
import type { CloneExecutor, CloneToolResult } from "../src/types.ts";

const result: CloneToolResult = {
  status: "succeeded",
  sourceUrl: "https://example.com/",
  runDir: "/run",
  sourceDir: "/run/source",
  appDir: "/run/app",
  nodeCount: 12,
  missingAssets: 0,
  fileCount: 1,
  totalBytes: 3,
  files: ["a"],
};

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

test("job manager starts immediately, exposes progress, locks, and retains terminal result", async () => {
  const release = deferred();
  const executor: CloneExecutor = {
    clone: async (_request, context) => {
      await context?.progress?.emit({ event: "captured", viewport: 1280 });
      await release.promise;
      return result;
    },
  };
  const jobs = new InMemoryCloneJobManager(executor, { createId: () => "job-1" });

  const started = jobs.start({ source: "https://example.com/" });
  assert.deepEqual(started, { jobId: "job-1", status: "running" });
  await new Promise((resolve) => setImmediate(resolve));

  const running = jobs.status(started.jobId);
  assert.equal(running?.status, "running");
  assert.deepEqual(running?.events.map((event) => event.event), ["job_started", "captured"]);
  assert.equal(running?.events[1]?.data.viewport, 1280);
  assert.throws(() => jobs.start({ source: "https://other.example/" }), /jobId: job-1/);

  release.resolve();
  const completed = await jobs.wait(started.jobId);
  assert.equal(completed?.status, "succeeded");
  assert.deepEqual(completed?.result, result);
  assert.equal(completed?.lastEvent?.event, "job_succeeded");
  assert.equal(completed?.cancellationRequested, false);
});

test("job manager records failures and cancellation as terminal states", async () => {
  let nextId = 0;
  const failedJobs = new InMemoryCloneJobManager({
    clone: async () => { throw new Error("compiler exploded"); },
  }, { createId: () => `job-${++nextId}` });
  const failed = failedJobs.start({ source: "https://example.com/" });
  const failedView = await failedJobs.wait(failed.jobId);
  assert.equal(failedView?.status, "failed");
  assert.equal(failedView?.error, "compiler exploded");
  assert.equal(failedView?.lastEvent?.event, "job_failed");

  const cancellingJobs = new InMemoryCloneJobManager({
    clone: (_request, context) => {
      return new Promise<CloneToolResult>((_resolve, reject) => {
        context?.signal?.addEventListener("abort", () => reject(context.signal?.reason), { once: true });
      });
    },
  }, { createId: () => "cancel-me" });
  const active = cancellingJobs.start({ source: "https://example.com/" });
  await new Promise((resolve) => setImmediate(resolve));
  const cancelling = cancellingJobs.cancel(active.jobId);
  assert.equal(cancelling?.status, "cancelling");
  assert.equal(cancelling?.cancellationRequested, true);

  const cancelled = await cancellingJobs.wait(active.jobId);
  assert.equal(cancelled?.status, "cancelled");
  assert.equal(cancelled?.error, "clone cancelled");
  assert.equal(cancelled?.lastEvent?.event, "job_cancelled");
  assert.equal(cancellingJobs.cancel(active.jobId)?.status, "cancelled");
  assert.equal(cancellingJobs.cancel("missing"), null);
});

test("job manager pages cursor events and reports ring truncation", async () => {
  const jobs = new InMemoryCloneJobManager({
    clone: async (_request, context) => {
      await context?.progress?.emit({ event: "phase_1" });
      await context?.progress?.emit({ event: "phase_2" });
      await context?.progress?.emit({ event: "phase_3" });
      return result;
    },
  }, { createId: () => "bounded", maxEvents: 2 });
  const started = jobs.start({ source: "https://example.com/" });
  await jobs.wait(started.jobId);

  const first = jobs.status(started.jobId, { after: 0, limit: 1 });
  assert.equal(first?.eventsTruncated, true);
  assert.equal(first?.hasMore, true);
  assert.equal(first?.events.length, 1);
  const second = jobs.status(started.jobId, { after: first?.nextCursor, limit: 1 });
  assert.equal(second?.events.length, 1);
  assert.equal(second?.hasMore, false);
  assert.equal(second?.events[0]?.event, "job_succeeded");
});
