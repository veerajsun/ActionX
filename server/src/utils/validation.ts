import { z } from "zod";

export const videoAnalyzeSchema = z.object({
  url: z.string().min(1, "A URL is required.").url("The provided URL is not valid."),
});

export const videoDownloadSchema = z.object({
  url: z.string().min(1).url(),
  format: z.enum(["mp4", "webm"]),
  quality: z.enum(["360p", "480p", "720p", "1080p"]),
});

export const audioAnalyzeSchema = z.object({
  url: z.string().min(1).url(),
});

export const audioConvertSchema = z.object({
  url: z.string().min(1).url(),
  format: z.enum(["mp3", "m4a", "wav"]),
  quality: z.enum(["128", "192", "256", "320"]),
  normalize: z.coerce.boolean().default(true),
});

export const IMAGE_OUTPUT_FORMATS = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff"] as const;
export type ImageOutputFormat = (typeof IMAGE_OUTPUT_FORMATS)[number];

export const imageConvertFieldsSchema = z.object({
  format: z.enum(IMAGE_OUTPUT_FORMATS),
  quality: z.coerce.number().int().min(1).max(100).default(85),
  width: z.coerce.number().int().positive().max(10_000).optional(),
  height: z.coerce.number().int().positive().max(10_000).optional(),
  // NOTE: z.coerce.boolean() would treat the string "false" as JS-truthy
  // (Boolean("false") === true) since it's a non-empty string — a classic
  // Zod footgun for multipart/form fields. Match the literal string instead.
  keepAspectRatio: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .default(true)
    .transform((value) => value === true || value === "true"),
});

/**
 * Hostnames/IP ranges that must never be reachable from this server's outbound
 * requests. This is a basic literal-string SSRF guard (no DNS resolution) —
 * see README "Production considerations" for hardening this further.
 */
const BLOCKED_HOSTNAME_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^\[::1\]$/,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./, // link-local / cloud metadata endpoint range
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /\.local$/i,
];

export interface UrlCheckResult {
  ok: boolean;
  reason?: string;
}

/** Validates that a user-supplied media URL is safe to hand to yt-dlp. */
export function checkMediaUrl(rawUrl: string): UrlCheckResult {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "The provided URL could not be parsed." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "Only http(s) URLs are supported." };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, reason: "URLs with embedded credentials are not supported." };
  }

  const hostname = parsed.hostname;
  if (BLOCKED_HOSTNAME_PATTERNS.some((pattern) => pattern.test(hostname))) {
    return { ok: false, reason: "This host cannot be processed." };
  }

  return { ok: true };
}
