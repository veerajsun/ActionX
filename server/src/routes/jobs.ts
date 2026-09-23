import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Errors } from "../utils/errors.js";
import { getJob } from "../jobs/jobStore.js";
import type { AudioConvertJobResult, VideoDownloadJobResult } from "../types/media.js";

const paramsSchema = z.object({ jobId: z.string().uuid() });

export async function jobsRoutes(app: FastifyInstance) {
  app.get("/api/jobs/:jobId", async (request) => {
    const parsed = paramsSchema.safeParse(request.params);
    if (!parsed.success) throw Errors.invalidInput("Invalid job id.");

    const job = getJob(parsed.data.jobId);
    if (!job) throw Errors.notFound("This job does not exist or has expired.");

    if (job.status === "failed") {
      return {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        error: job.error,
      };
    }

    if (job.status === "completed") {
      const result = job.result as VideoDownloadJobResult | AudioConvertJobResult;
      return {
        jobId: job.id,
        status: job.status,
        progress: 100,
        downloadUrl: result.downloadUrl,
        result,
      };
    }

    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      message: job.message,
    };
  });
}
