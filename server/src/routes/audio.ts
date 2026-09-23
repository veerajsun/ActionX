import type { FastifyInstance } from "fastify";
import { ApiError, Errors } from "../utils/errors.js";
import { audioAnalyzeSchema, audioConvertSchema, checkMediaUrl } from "../utils/validation.js";
import { checkBinaryAvailable } from "../services/mediaService.js";
import { analyzeAudio, convertAudio } from "../services/audioService.js";
import { config } from "../config.js";
import { createJob, markJobCompleted, markJobFailed, markJobProcessing } from "../jobs/jobStore.js";

async function requireAudioBinaries(): Promise<void> {
  const [ytDlpAvailable, ffmpegAvailable] = await Promise.all([
    checkBinaryAvailable(config.ytDlpPath, "--version"),
    checkBinaryAvailable(config.ffmpegPath, "-version"),
  ]);
  if (!ytDlpAvailable) {
    throw Errors.serviceUnavailable(
      "The video engine (yt-dlp) is not installed on this server. See README for setup instructions.",
    );
  }
  if (!ffmpegAvailable) {
    throw Errors.serviceUnavailable(
      "FFmpeg is not installed on this server. See README for setup instructions.",
    );
  }
}

export async function audioRoutes(app: FastifyInstance) {
  app.post("/api/audio/analyze", async (request) => {
    const parsed = audioAnalyzeSchema.safeParse(request.body);
    if (!parsed.success) throw Errors.invalidInput(parsed.error.issues[0]?.message ?? "Invalid input.");

    const urlCheck = checkMediaUrl(parsed.data.url);
    if (!urlCheck.ok) throw Errors.invalidUrl(urlCheck.reason);

    const ytDlpAvailable = await checkBinaryAvailable(config.ytDlpPath, "--version");
    if (!ytDlpAvailable) {
      throw Errors.serviceUnavailable(
        "The video engine (yt-dlp) is not installed on this server. See README for setup instructions.",
      );
    }

    request.log.info({ url: parsed.data.url }, "Audio analyze requested");
    try {
      const media = await analyzeAudio(parsed.data.url);
      return { success: true, media };
    } catch (err) {
      const typed = err as Error & { code?: string };
      throw new ApiError(422, typed.code ?? "ANALYZE_FAILED", typed.message || "Could not analyze this source.");
    }
  });

  app.post("/api/audio/convert", async (request, reply) => {
    const parsed = audioConvertSchema.safeParse(request.body);
    if (!parsed.success) throw Errors.invalidInput(parsed.error.issues[0]?.message ?? "Invalid input.");

    const urlCheck = checkMediaUrl(parsed.data.url);
    if (!urlCheck.ok) throw Errors.invalidUrl(urlCheck.reason);

    await requireAudioBinaries();

    const job = createJob("audio-convert");
    request.log.info({ jobId: job.id, url: parsed.data.url }, "Audio convert job created");

    void (async () => {
      markJobProcessing(job.id, 0, "Extracting audio...");
      try {
        const result = await convertAudio({
          url: parsed.data.url,
          format: parsed.data.format,
          quality: parsed.data.quality,
          normalize: parsed.data.normalize,
          onProgress: (percent) =>
            markJobProcessing(
              job.id,
              Math.round(percent),
              percent < 50 ? "Extracting audio..." : "Transcoding...",
            ),
        });
        markJobCompleted(job.id, result);
        request.log.info({ jobId: job.id }, "Audio convert job completed");
      } catch (err) {
        const typed = err as Error & { code?: string };
        markJobFailed(job.id, {
          code: typed.code ?? "CONVERT_FAILED",
          message: typed.message || "The conversion could not be completed.",
        });
        request.log.warn({ jobId: job.id, error: typed.message }, "Audio convert job failed");
      }
    })();

    return reply.status(202).send({ jobId: job.id, status: "queued" });
  });
}
