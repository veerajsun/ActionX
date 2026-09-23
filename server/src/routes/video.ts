import type { FastifyInstance } from "fastify";
import { ApiError, Errors } from "../utils/errors.js";
import { checkMediaUrl, videoAnalyzeSchema, videoDownloadSchema } from "../utils/validation.js";
import { checkBinaryAvailable } from "../services/mediaService.js";
import { analyzeVideo, downloadVideo } from "../services/videoService.js";
import { config } from "../config.js";
import { createJob, markJobCompleted, markJobFailed, markJobProcessing } from "../jobs/jobStore.js";

export async function videoRoutes(app: FastifyInstance) {
  app.post("/api/video/analyze", async (request) => {
    const parsed = videoAnalyzeSchema.safeParse(request.body);
    if (!parsed.success) throw Errors.invalidInput(parsed.error.issues[0]?.message ?? "Invalid input.");

    const urlCheck = checkMediaUrl(parsed.data.url);
    if (!urlCheck.ok) throw Errors.invalidUrl(urlCheck.reason);

    const ytDlpAvailable = await checkBinaryAvailable(config.ytDlpPath, "--version");
    if (!ytDlpAvailable) {
      throw Errors.serviceUnavailable(
        "The video engine (yt-dlp) is not installed on this server. See README for setup instructions.",
      );
    }

    request.log.info({ url: parsed.data.url }, "Video analyze requested");
    try {
      const media = await analyzeVideo(parsed.data.url);
      return { success: true, media };
    } catch (err) {
      const typed = err as Error & { code?: string };
      throw new ApiError(422, typed.code ?? "ANALYZE_FAILED", typed.message || "Could not analyze this video.");
    }
  });

  app.post("/api/video/download", async (request, reply) => {
    const parsed = videoDownloadSchema.safeParse(request.body);
    if (!parsed.success) throw Errors.invalidInput(parsed.error.issues[0]?.message ?? "Invalid input.");

    const urlCheck = checkMediaUrl(parsed.data.url);
    if (!urlCheck.ok) throw Errors.invalidUrl(urlCheck.reason);

    const ytDlpAvailable = await checkBinaryAvailable(config.ytDlpPath, "--version");
    if (!ytDlpAvailable) {
      throw Errors.serviceUnavailable(
        "The video engine (yt-dlp) is not installed on this server. See README for setup instructions.",
      );
    }

    const job = createJob("video-download");
    request.log.info({ jobId: job.id, url: parsed.data.url }, "Video download job created");

    // Fire and forget — the client polls GET /api/jobs/:jobId for progress.
    void (async () => {
      markJobProcessing(job.id, 0, "Starting download...");
      try {
        const result = await downloadVideo({
          url: parsed.data.url,
          format: parsed.data.format,
          quality: parsed.data.quality,
          onProgress: (percent) => markJobProcessing(job.id, Math.round(percent), "Downloading..."),
        });
        markJobCompleted(job.id, result);
        request.log.info({ jobId: job.id }, "Video download job completed");
      } catch (err) {
        const typed = err as Error & { code?: string };
        markJobFailed(job.id, {
          code: typed.code ?? "DOWNLOAD_FAILED",
          message: typed.message || "The download could not be completed.",
        });
        request.log.warn({ jobId: job.id, error: typed.message }, "Video download job failed");
      }
    })();

    return reply.status(202).send({ jobId: job.id, status: "queued" });
  });
}
