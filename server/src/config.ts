import "dotenv/config";
import { z } from "zod";
import path from "node:path";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  TEMP_DIR: z.string().default("./tmp"),
  MAX_VIDEO_FILE_SIZE_MB: z.coerce.number().positive().default(500),
  MAX_IMAGE_FILE_SIZE_MB: z.coerce.number().positive().default(20),
  VIDEO_FILE_RETENTION_MINUTES: z.coerce.number().positive().default(30),
  IMAGE_FILE_RETENTION_MINUTES: z.coerce.number().positive().default(15),
  JOB_RETENTION_MINUTES: z.coerce.number().positive().default(60),
  RATE_LIMIT_MAX: z.coerce.number().positive().default(60),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(60_000),
  FFMPEG_PATH: z.string().default("ffmpeg"),
  FFPROBE_PATH: z.string().default("ffprobe"),
  YTDLP_PATH: z.string().default("yt-dlp"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

export const config = {
  port: env.PORT,
  frontendUrl: env.FRONTEND_URL,
  tempDir: path.resolve(process.cwd(), env.TEMP_DIR),
  maxVideoFileSizeBytes: env.MAX_VIDEO_FILE_SIZE_MB * 1024 * 1024,
  maxImageFileSizeBytes: env.MAX_IMAGE_FILE_SIZE_MB * 1024 * 1024,
  videoFileRetentionMs: env.VIDEO_FILE_RETENTION_MINUTES * 60 * 1000,
  imageFileRetentionMs: env.IMAGE_FILE_RETENTION_MINUTES * 60 * 1000,
  jobRetentionMs: env.JOB_RETENTION_MINUTES * 60 * 1000,
  rateLimit: {
    max: env.RATE_LIMIT_MAX,
    windowMs: env.RATE_LIMIT_WINDOW_MS,
  },
  ffmpegPath: env.FFMPEG_PATH,
  ffprobePath: env.FFPROBE_PATH,
  ytDlpPath: env.YTDLP_PATH,
  isProduction: env.NODE_ENV === "production",
};
