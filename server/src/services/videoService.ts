import path from "node:path";
import { promises as fs } from "node:fs";
import { config } from "../config.js";
import { registerTempFile } from "../utils/cleanup.js";
import { formatBytes, generateFileId, resolveTempPath } from "../utils/files.js";
import type { VideoAnalyzeResult, VideoDownloadJobResult, VideoQualityInfo } from "../types/media.js";
import { classifyYtDlpError, YtDlpError, ytDlpDownload, ytDlpProbe } from "./mediaService.js";

interface YtDlpFormat {
  format_id?: string;
  ext?: string;
  height?: number;
  vcodec?: string;
  acodec?: string;
  tbr?: number;
  filesize?: number;
  filesize_approx?: number;
}

interface YtDlpInfo {
  title?: string;
  duration?: number;
  thumbnail?: string;
  extractor_key?: string;
  webpage_url_domain?: string;
  fps?: number;
  dynamic_range?: string;
  vcodec?: string;
  acodec?: string;
  tbr?: number;
  formats?: YtDlpFormat[];
}

const CANONICAL_HEIGHTS = [360, 480, 720, 1080] as const;
const HEIGHT_MATCH_TOLERANCE = 40;

function nearestFormatForHeight(formats: YtDlpFormat[], targetHeight: number): YtDlpFormat | undefined {
  const videoFormats = formats.filter((f) => f.height && f.vcodec && f.vcodec !== "none");
  const withinTolerance = videoFormats.filter(
    (f) => Math.abs((f.height ?? 0) - targetHeight) <= HEIGHT_MATCH_TOLERANCE,
  );
  if (withinTolerance.length > 0) {
    return withinTolerance.sort((a, b) => (b.tbr ?? 0) - (a.tbr ?? 0))[0];
  }
  return undefined;
}

function buildQualities(formats: YtDlpFormat[]): VideoQualityInfo[] {
  const qualities: VideoQualityInfo[] = [];
  for (const height of CANONICAL_HEIGHTS) {
    const match = nearestFormatForHeight(formats, height);
    if (!match) continue;
    const size = match.filesize ?? match.filesize_approx;
    qualities.push({
      id: `${height}p`,
      label: `${height}p`,
      sizeEstimate: size ? `~${formatBytes(size)}` : "~Estimate unavailable",
      badge: height === 1080 ? "BEST" : height === 720 ? "HD" : undefined,
    });
  }

  if (qualities.length > 0) return qualities;

  // Nothing matched a canonical bucket (unusual source resolution) — offer the
  // single closest available height so the UI still has something to select.
  const videoFormats = formats.filter((f) => f.height && f.vcodec && f.vcodec !== "none");
  const best = videoFormats.sort((a, b) => (b.height ?? 0) - (a.height ?? 0))[0];
  if (best?.height) {
    const size = best.filesize ?? best.filesize_approx;
    qualities.push({
      id: `${best.height}p`,
      label: `${best.height}p`,
      sizeEstimate: size ? `~${formatBytes(size)}` : "~Estimate unavailable",
      badge: "BEST",
    });
  }
  return qualities;
}

function formatBitrateLabel(tbrKbps: number | undefined): string {
  if (!tbrKbps) return "Unknown";
  return tbrKbps >= 1000 ? `${(tbrKbps / 1000).toFixed(1)} Mbps` : `${Math.round(tbrKbps)} kbps`;
}

export async function analyzeVideo(url: string): Promise<VideoAnalyzeResult> {
  let info: YtDlpInfo;
  try {
    info = (await ytDlpProbe(url)) as YtDlpInfo;
  } catch (err) {
    if (err instanceof YtDlpError) {
      const { code, message } = classifyYtDlpError(err.rawStderr);
      const error = new Error(message) as Error & { code: string };
      error.code = code;
      throw error;
    }
    throw err;
  }

  const formats = info.formats ?? [];

  return {
    title: info.title ?? "Untitled",
    host: info.extractor_key ?? info.webpage_url_domain ?? "Unknown",
    duration: info.duration ?? 0,
    thumbnail: info.thumbnail ?? "",
    fps: info.fps ?? null,
    hdr: Boolean(info.dynamic_range && info.dynamic_range !== "SDR"),
    bitrate: formatBitrateLabel(info.tbr),
    audioCodec: info.acodec && info.acodec !== "none" ? info.acodec : "Unknown",
    videoCodec: info.vcodec && info.vcodec !== "none" ? info.vcodec : "Unknown",
    formats: [
      { id: "mp4", label: "MP4 (AVC/H.264)" },
      { id: "webm", label: "WebM (VP9)" },
    ],
    qualities: buildQualities(formats),
  };
}

export async function downloadVideo(params: {
  url: string;
  format: "mp4" | "webm";
  quality: string; // e.g. "1080p"
  onProgress?: (percent: number) => void;
}): Promise<VideoDownloadJobResult> {
  const height = parseInt(params.quality.replace("p", ""), 10) || 1080;
  const audioExt = params.format === "webm" ? "webm" : "m4a";
  const formatSelector = [
    `bestvideo[height<=${height}][ext=${params.format}]+bestaudio[ext=${audioExt}]`,
    `best[height<=${height}][ext=${params.format}]`,
    `best[height<=${height}]`,
  ].join("/");

  const fileId = generateFileId();
  const outputTemplate = path.join(config.tempDir, `${fileId}.%(ext)s`);

  try {
    await ytDlpDownload({
      url: params.url,
      formatSelector,
      outputTemplate,
      mergeFormat: params.format,
      onProgress: params.onProgress,
    });
  } catch (err) {
    if (err instanceof YtDlpError) {
      const { code, message } = classifyYtDlpError(err.rawStderr);
      const error = new Error(message) as Error & { code: string };
      error.code = code;
      throw error;
    }
    throw err;
  }

  const finalPath = resolveTempPath(fileId, `.${params.format}`);
  const stat = await fs.stat(finalPath);

  const stored = registerTempFile({
    id: fileId,
    absolutePath: finalPath,
    filename: `actionx-video-${height}p.${params.format}`,
    mimeType: params.format === "webm" ? "video/webm" : "video/mp4",
    expiresAt: Date.now() + config.videoFileRetentionMs,
  });

  return {
    filename: stored.filename,
    sizeLabel: formatBytes(stat.size),
    formatLabel: params.format === "webm" ? "WebM (VP9)" : "MP4 (H.264)",
    qualityLabel: params.quality,
    downloadUrl: `/api/download/${fileId}`,
  };
}
