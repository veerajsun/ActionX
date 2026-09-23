import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import { config } from "./config.js";
import { apiErrorHandler } from "./utils/errors.js";
import { ensureTempDir } from "./utils/files.js";
import { startCleanupSweep } from "./utils/cleanup.js";
import { startJobCleanupSweep } from "./jobs/jobStore.js";
import { checkAllBinaries } from "./services/mediaService.js";
import { healthRoutes } from "./routes/health.js";
import { videoRoutes } from "./routes/video.js";
import { audioRoutes } from "./routes/audio.js";
import { imageRoutes } from "./routes/image.js";
import { jobsRoutes } from "./routes/jobs.js";
import { downloadRoutes } from "./routes/download.js";

async function main() {
  await ensureTempDir();

  const app = Fastify({
    logger: config.isProduction
      ? true
      : {
          transport: {
            target: "pino-pretty",
            options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" },
          },
        },
    bodyLimit: config.maxVideoFileSizeBytes,
  });

  await app.register(cors, {
    origin: config.frontendUrl,
    methods: ["GET", "POST"],
  });

  await app.register(multipart, {
    limits: {
      fileSize: config.maxImageFileSizeBytes,
      files: 1,
    },
  });

  await app.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.windowMs,
    errorResponseBuilder: () => ({
      success: false,
      error: { code: "RATE_LIMITED", message: "Too many requests. Please slow down." },
    }),
  });

  app.setErrorHandler(apiErrorHandler);

  await app.register(healthRoutes);
  await app.register(videoRoutes);
  await app.register(audioRoutes);
  await app.register(imageRoutes);
  await app.register(jobsRoutes);
  await app.register(downloadRoutes);

  startCleanupSweep(app.log);
  startJobCleanupSweep(app.log);

  const binaries = await checkAllBinaries();
  app.log.info(binaries, "Startup binary check (ffmpeg / ffprobe / yt-dlp)");
  if (!binaries.ffmpeg || !binaries.ffprobe) {
    app.log.warn(
      "FFmpeg/FFprobe not found on PATH — video/audio processing will fail until it's installed. See README.",
    );
  }
  if (!binaries.ytDlp) {
    app.log.warn(
      "yt-dlp not found on PATH — video/audio analysis and downloads will fail until it's installed. See README.",
    );
  }

  await app.listen({ port: config.port, host: "0.0.0.0" });
  app.log.info(`ActionX API listening on http://localhost:${config.port}`);
  app.log.info(`CORS restricted to ${config.frontendUrl}`);
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
