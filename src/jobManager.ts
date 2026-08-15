import { randomUUID } from "node:crypto";
import type {
  CloneExecutor,
  CloneJobEvent,
  CloneJobManager,
  CloneJobStart,
  CloneJobStatus,
  CloneJobView,
  CloneProgressEvent,
  CloneProgressSink,
  CloneToolRequest,
  CloneToolResult,
} from "./types.ts";

const DEFAULT_MAX_EVENTS = 200;
const DEFAULT_MAX_RETAINED_JOBS = 10;
const DEFAULT_EVENT_LIMIT = 20;
const MAX_EVENT_LIMIT = 100;

type StoredJob = {
  jobId: string;
  status: CloneJobStatus;
  startedAt: string;
  completedAt?: string;
  cancellationRequested: boolean;
  controller: AbortController;
  events: CloneJobEvent[];
  nextEventCursor: number;
  completion: Promise<void>;
  result?: CloneToolResult;
  error?: string;
};

export type InMemoryCloneJobManagerOptions = {
  maxEvents?: number;
  maxRetainedJobs?: number;
  createId?: () => string;
  now?: () => Date;
};

function errorMessage(error: unknown): string {
  return String(error instanceof Error ? error.message : error).slice(0, 1000);
}

function abortError(): Error {
  const error = new Error("clone cancelled");
  error.name = "AbortError";
  return error;
}

function isActive(status: CloneJobStatus): boolean {
  return status === "running" || status === "cancelling";
}

export class InMemoryCloneJobManager implements CloneJobManager {
  private readonly executor: CloneExecutor;
  private readonly maxEvents: number;
  private readonly maxRetainedJobs: number;
  private readonly createId: () => string;
  private readonly now: () => Date;
  private readonly jobs = new Map<string, StoredJob>();
  private activeJobId: string | undefined;

  constructor(executor: CloneExecutor, options: InMemoryCloneJobManagerOptions = {}) {
    this.executor = executor;
    this.maxEvents = Math.max(1, Math.floor(options.maxEvents ?? DEFAULT_MAX_EVENTS));
    this.maxRetainedJobs = Math.max(1, Math.floor(options.maxRetainedJobs ?? DEFAULT_MAX_RETAINED_JOBS));
    this.createId = options.createId ?? randomUUID;
    this.now = options.now ?? (() => new Date());
  }

  start(request: CloneToolRequest, progress?: CloneProgressSink): CloneJobStart {
    const active = this.activeJobId ? this.jobs.get(this.activeJobId) : undefined;
    if (active && isActive(active.status)) {
      throw new Error(`another clone is already running (jobId: ${active.jobId})`);
    }
    this.activeJobId = undefined;
    this.pruneCompletedJobs();

    const jobId = this.createId();
    const job: StoredJob = {
      jobId,
      status: "running",
      startedAt: this.now().toISOString(),
      cancellationRequested: false,
      controller: new AbortController(),
      events: [],
      nextEventCursor: 1,
      completion: Promise.resolve(),
    };
    this.jobs.set(jobId, job);
    this.activeJobId = jobId;
    job.completion = this.run(job, request, progress);
    return { jobId, status: "running" };
  }

  status(jobId: string, options: { after?: number; limit?: number } = {}): CloneJobView | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    const after = Math.max(0, Math.floor(options.after ?? 0));
    const limit = Math.min(MAX_EVENT_LIMIT, Math.max(1, Math.floor(options.limit ?? DEFAULT_EVENT_LIMIT)));
    const oldestCursor = job.events[0]?.cursor ?? job.nextEventCursor;
    const available = job.events.filter((event) => event.cursor > after);
    const events = available.slice(0, limit);
    const nextCursor = events.at(-1)?.cursor ?? after;
    const lastEvent = job.events.at(-1);

    return {
      jobId: job.jobId,
      status: job.status,
      startedAt: job.startedAt,
      ...(job.completedAt ? { completedAt: job.completedAt } : {}),
      cancellationRequested: job.cancellationRequested,
      events,
      nextCursor,
      hasMore: available.length > events.length,
      eventsTruncated: after < oldestCursor - 1,
      ...(lastEvent ? { lastEvent } : {}),
      ...(job.result ? { result: job.result } : {}),
      ...(job.error ? { error: job.error } : {}),
    };
  }

  async wait(jobId: string): Promise<CloneJobView | null> {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    await job.completion;
    return this.status(jobId);
  }

  cancel(jobId: string): CloneJobView | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    if (job.status === "running") {
      job.status = "cancelling";
      job.cancellationRequested = true;
      void this.record(job, { event: "job_cancelling" });
      job.controller.abort(abortError());
    }
    return this.status(jobId);
  }

  private async run(job: StoredJob, request: CloneToolRequest, progress?: CloneProgressSink): Promise<void> {
    await this.record(job, { event: "job_started" }, progress);
    try {
      const result = await this.executor.clone(request, {
        signal: job.controller.signal,
        progress: { emit: (event) => this.record(job, event, progress) },
      });
      if (job.controller.signal.aborted) throw job.controller.signal.reason ?? abortError();
      job.result = result;
      job.status = "succeeded";
      job.completedAt = this.now().toISOString();
      await this.record(job, { event: "job_succeeded" }, progress);
    } catch (error) {
      const cancelled = job.controller.signal.aborted;
      job.status = cancelled ? "cancelled" : "failed";
      job.error = cancelled ? "clone cancelled" : errorMessage(error);
      job.completedAt = this.now().toISOString();
      await this.record(job, { event: cancelled ? "job_cancelled" : "job_failed", error: job.error }, progress);
    } finally {
      if (this.activeJobId === job.jobId) this.activeJobId = undefined;
    }
  }

  private async record(job: StoredJob, raw: CloneProgressEvent, progress?: CloneProgressSink): Promise<void> {
    const eventName = typeof raw.event === "string" ? raw.event : "clone_progress";
    const data = { ...raw };
    delete data.event;
    const event: CloneJobEvent = {
      cursor: job.nextEventCursor++,
      at: this.now().toISOString(),
      event: eventName,
      data,
    };
    job.events.push(event);
    if (job.events.length > this.maxEvents) job.events.splice(0, job.events.length - this.maxEvents);
    if (!progress) return;
    try {
      await progress.emit(raw);
    } catch {
      // Progress delivery is advisory. Job execution must survive a disconnected client.
    }
  }

  private pruneCompletedJobs(): void {
    if (this.jobs.size < this.maxRetainedJobs) return;
    for (const [jobId, job] of this.jobs) {
      if (this.jobs.size < this.maxRetainedJobs) break;
      if (!isActive(job.status)) this.jobs.delete(jobId);
    }
  }
}
