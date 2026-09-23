import path from "node:path";
import { promises as fs } from "node:fs";
import { config } from "../config.js";
import { registerTempFile } from "../utils/cleanup.js";
import {
  findFileByPrefix,
  formatBytes,
  formatDuration,
  generateFileId,
  resolveTempPath,
  safeUnlink,
} from "../utils/files.js";
import type { AudioAnalyzeResult, AudioConvertJobResult } from "../types/media.js";
import {
  classifyYtDlpError,
  ffprobeFile,
  runFfmpeg,
  YtDlpError,
  ytDlpDownload,
  ytDlpProbe,
} from "./mediaService.js";

interface YtDlpAudioFormat {
  acodec?: string;
  asr?: number;
  audio_channels?: number;
}

interface YtDlpInfo {
  title?: string;
  duration?: number;
  thumbnail?: string;
  extractor_key?: string;
  webpage_url_domain?: string;
  uploader?: string;
  formats?: YtDlpAudioFormat[];
}

function rethrowAsClassified(err: unknown): never {
  if (err instanceof YtDlpError) {
    const { code, message } = classifyYtDlpError(err.rawStderr);
    const error = new Error(message) as Error & { code: string };
    error.code = code;
    throw error;
  }
  throw err as Error;
}

export async function analyzeAudio(url: string): Promise<AudioAnalyzeResult> {
  let info: YtDlpInfo;
  try {
    info = (await ytDlpProbe(url)) as YtDlpInfo;
  } catch (err) {
    rethrowAsClassified(err);
  }

  const audioFormats = (info.formats ?? []).filter((f) => f.acodec && f.acodec !== "none" && f.asr);
  const bestAudio = audioFormats.sort((a, b) => (b.asr ?? 0) - (a.asr ?? 0))[0];
  const sampleRateLabel = bestAudio?.asr
    ? `${(bestAudio.asr / 1000).toFixed(1)} kHz${bestAudio.audio_channels === 1 ? " Mono" : " Stereo"}`
    : "48.0 kHz Stereo";

  return {
    title: info.title ?? "Untitled",
    subtitle: info.uploader ? `${info.uploader} • Source Audio Track` : "Source Audio Track",
    host: info.extractor_key ?? info.webpage_url_domain ?? "Unknown",
    duration: info.duration ?? 0,
    thumbnail: info.thumbnail ?? "",
    sampleRateLabel,
  };
}

const MIME_BY_FORMAT: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
};

export async function convertAudio(params: {
  url: string;
  format: "mp3" | "m4a" | "wav";
  quality: "128" | "192" | "256" | "320";
  normalize: boolean;
  onProgress?: (percent: number) => void;
}): Promise<AudioConvertJobResult> {
  const rawId = generateFileId();
  const rawTemplate = path.join(config.tempDir, `${rawId}.%(ext)s`);

  try {
    await ytDlpDownload({
      url: params.url,
      formatSelector: "bestaudio/best",
      outputTemplate: rawTemplate,
      onProgress: (percent) => params.onProgress?.(percent / 2),
    });
  } catch (err) {
    rethrowAsClassified(err);
  }

  const rawPath = await findFileByPrefix(config.tempDir, rawId);

  let durationSeconds = 0;
  try {
    const probe = await ffprobeFile(rawPath);
    durationSeconds = probe.durationSeconds;
  } catch {
    // Fall back to indeterminate progress if ffprobe can't read the raw file.
  }

  const outFileId = generateFileId();
  const outPath = resolveTempPath(outFileId, `.${params.format}`);

  const filters = params.normalize ? ["-af", "loudnorm=I=-14:TP=-1.5:LRA=11"] : [];
  const codecArgs =
    params.format === "mp3"
      ? ["-codec:a", "libmp3lame", "-b:a", `${params.quality}k`]
      : params.format === "m4a"
        ? ["-codec:a", "aac", "-b:a", `${params.quality}k`]
        : ["-codec:a", "pcm_s16le"];

  try {
    await runFfmpeg({
      args: ["-i", rawPath, "-vn", ...filters, ...codecArgs, outPath],
      totalDurationSeconds: durationSeconds,
      onProgress: (percent) => params.onProgress?.(50 + percent / 2),
    });
  } finally {
    await safeUnlink(rawPath);
  }

  const stat = await fs.stat(outPath);
  const stored = registerTempFile({
    id: outFileId,
    absolutePath: outPath,
    filename: `actionx-audio-${params.quality}kbps.${params.format}`,
    mimeType: MIME_BY_FORMAT[params.format],
    expiresAt: Date.now() + config.videoFileRetentionMs,
  });

  return {
    filename: stored.filename,
    formatLabel: params.format.toUpperCase(),
    qualityLabel: params.format === "wav" ? "Lossless" : `${params.quality} kbps`,
    durationLabel: formatDuration(durationSeconds),
    sizeLabel: formatBytes(stat.size),
    downloadUrl: `/api/download/${outFileId}`,
  };
}
