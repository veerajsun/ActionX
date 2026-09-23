import { randomUUID } from "node:crypto";
import type { FastifyBaseLogger } from "fastify";
import { config } from "../config.js";
import type { Job, JobError, JobStatus, JobType } from "../types/media.js";

/**
 * In-memory job store. Fine for local development / a single-process MVP.
 *
 * Production should replace this with a persistent, multi-worker-safe queue
 * (e.g. Redis + BullMQ) so jobs survive restarts and can be processed by more
 * than one server instance. See README "Production considerations".
 */
const jobs = new Map<string, Job>();

export function createJob(type: JobType): Job {
  const now = Date.now();
  const job: Job = {
    id: randomUUID(),
    type,
    status: "queued",
    progress: 0,
    createdAt: now,
    updatedAt: now,
  };
  jobs.set(job.id, job);
  return job;
}

export function getJob(jobId: string): Job | undefined {
  return jobs.get(jobId);
}

export function updateJob(
  jobId: string,
  patch: Partial<Pick<Job, "status" | "progress" | "message" | "result" | "error">>,
): Job | undefined {
  const job = jobs.get(jobId);
  if (!job) return undefined;
  Object.assign(job, patch, { updatedAt: Date.now() });
  return job;
}

export function markJobFailed(jobId: string, error: JobError): Job | undefined {
  return updateJob(jobId, { status: "failed", error, progress: 100 });
}

export function markJobProcessing(jobId: string, progress: number, message?: string): Job | undefined {
  return updateJob(jobId, { status: "processing", progress, message });
}

export function markJobCompleted(jobId: string, result: unknown): Job | undefined {
  return updateJob(jobId, { status: "completed", progress: 100, result });
}

export function jobStatusOf(jobId: string): JobStatus | undefined {
  return jobs.get(jobId)?.status;
}

export function startJobCleanupSweep(logger: FastifyBaseLogger, intervalMs = 60_000): NodeJS.Timeout {
  return setInterval(() => {
    const now = Date.now();
    let removed = 0;
    for (const [id, job] of jobs) {
      const isFinished = job.status === "completed" || job.status === "failed";
      if (isFinished && now - job.updatedAt > config.jobRetentionMs) {
        jobs.delete(id);
        removed += 1;
      }
    }
    if (removed > 0) logger.info({ removed }, "Cleanup: removed expired job records");
  }, intervalMs);
}
