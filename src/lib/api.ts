/**
 * Frontend API abstraction for the ActionX media pipeline.
 *
 * This talks to the real backend in /server (see server/README section in
 * the root README). Every function here matches the shape the mock
 * implementation used to return, so the tool pages and components didn't
 * need to change — only this file, plus a small `downloadUrl` field added to
 * a couple of result types and the "download" button handlers.
 */

import type {
  AnalyzedAudioSource,
  AnalyzedVideo,
  AudioResult,
  DownloadResult,
  HealthStatus,
  ImageFormatId,
  ImageResult,
} from "@/lib/types";
import { formatBytes, formatDuration } from "@/lib/utils";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "ApiError";
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface BackendErrorBody {
  success: false;
  error: { code: string; message: string };
}

/** Shared fetch wrapper: JSON body, timeout via AbortController, consistent error mapping. */
async function fetchJson<T>(path: string, init?: RequestInit, timeoutMs = 15_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError("TIMEOUT", "The request timed out. Is the ActionX API running?");
    }
    throw new ApiError("NETWORK_ERROR", "Could not reach the ActionX API. Is the backend running?");
  }
  clearTimeout(timer);

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // No/invalid JSON body — handled by the !response.ok branch below.
  }

  if (!response.ok) {
    const errorBody = body as Partial<BackendErrorBody> | null;
    throw new ApiError(
      errorBody?.error?.code ?? "REQUEST_FAILED",
      errorBody?.error?.message ?? `Request failed with status ${response.status}.`,
    );
  }

  return body as T;
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

interface HealthResponse {
  status: string;
  version?: string;
}

/** Drives the real "Engine Status" indicator on the home page. */
export async function checkHealth(): Promise<HealthStatus> {
  const start = typeof performance !== "undefined" ? performance.now() : Date.now();
  try {
    const body = await fetchJson<HealthResponse>("/api/health", { method: "GET" }, 4000);
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return { online: body.status === "ok", version: body.version, latencyMs: Math.round(end - start) };
  } catch {
    return { online: false };
  }
}

// ---------------------------------------------------------------------------
// Job polling (shared by video download + audio convert)
// ---------------------------------------------------------------------------

interface JobResponse<TResult> {
  jobId: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  message?: string;
  result?: TResult;
  error?: { code: string; message: string };
}

async function pollJob<TResult>(
  jobId: string,
  onProgress?: (percent: number) => void,
  intervalMs = 800,
): Promise<TResult> {
  // Local dev polling, as recommended for the first version — see README for
  // notes on upgrading to SSE/WebSockets later without changing this contract.
  for (;;) {
    const job = await fetchJson<JobResponse<TResult>>(`/api/jobs/${jobId}`, { method: "GET" }, 10_000);

    if (job.status === "failed") {
      throw new ApiError(job.error?.code ?? "JOB_FAILED", job.error?.message ?? "Processing failed.");
    }
    if (job.status === "completed") {
      onProgress?.(100);
      if (!job.result) throw new ApiError("JOB_MISSING_RESULT", "The job completed without a result.");
      return job.result;
    }

    onProgress?.(job.progress ?? 0);
    await wait(intervalMs);
  }
}

// ---------------------------------------------------------------------------
// Video Downloader
// ---------------------------------------------------------------------------

interface BackendVideoMedia {
  title: string;
  host: string;
  duration: number;
  thumbnail: string;
  fps: number | null;
  hdr: boolean;
  bitrate: string;
  audioCodec: string;
  videoCodec: string;
  formats: { id: string; label: string }[];
  qualities: { id: string; label: string; sizeEstimate: string; badge?: "HD" | "BEST" }[];
}

/** POST /api/video/analyze */
export async function analyzeVideo(url: string): Promise<AnalyzedVideo> {
  const body = await fetchJson<{ success: true; media: BackendVideoMedia }>("/api/video/analyze", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
  const m = body.media;
  return {
    title: m.title,
    host: m.host,
    durationLabel: formatDuration(m.duration),
    thumbnailUrl: m.thumbnail,
    fps: m.fps ?? 0,
    hdr: m.hdr,
    formats: m.formats,
    qualities: m.qualities,
    bitrate: m.bitrate,
    audioCodec: m.audioCodec,
    videoCodec: m.videoCodec,
  };
}

interface BackendVideoDownloadResult {
  filename: string;
  sizeLabel: string;
  formatLabel: string;
  qualityLabel: string;
  downloadUrl: string;
}

/** POST /api/video/download, then polls GET /api/jobs/:jobId until it resolves. */
export async function downloadVideo(
  params: { url: string; formatId: string; qualityId: string },
  onProgress?: (percent: number) => void,
): Promise<DownloadResult> {
  const { jobId } = await fetchJson<{ jobId: string; status: string }>("/api/video/download", {
    method: "POST",
    body: JSON.stringify({ url: params.url, format: params.formatId, quality: params.qualityId }),
  });

  const result = await pollJob<BackendVideoDownloadResult>(jobId, onProgress);
  return {
    filename: result.filename,
    sizeLabel: result.sizeLabel,
    formatLabel: result.formatLabel,
    qualityLabel: result.qualityLabel,
    downloadUrl: `${API_BASE_URL}${result.downloadUrl}`,
  };
}

// ---------------------------------------------------------------------------
// Video to Audio
// ---------------------------------------------------------------------------

interface BackendAudioMedia {
  title: string;
  subtitle: string;
  host: string;
  duration: number;
  thumbnail: string;
  sampleRateLabel: string;
}

/** POST /api/audio/analyze */
export async function analyzeAudio(url: string): Promise<AnalyzedAudioSource> {
  const body = await fetchJson<{ success: true; media: BackendAudioMedia }>("/api/audio/analyze", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
  const m = body.media;
  return {
    title: m.title,
    subtitle: m.subtitle,
    host: m.host,
    durationLabel: formatDuration(m.duration),
    durationSeconds: m.duration,
    thumbnailUrl: m.thumbnail,
    sampleRateLabel: m.sampleRateLabel,
  };
}

interface BackendAudioConvertResult {
  filename: string;
  formatLabel: string;
  qualityLabel: string;
  durationLabel: string;
  sizeLabel: string;
  downloadUrl: string;
}

/** POST /api/audio/convert, then polls GET /api/jobs/:jobId until it resolves. */
export async function convertAudio(
  params: { url: string; formatId: string; qualityId: string; normalize: boolean },
  onProgress?: (percent: number) => void,
): Promise<AudioResult> {
  const { jobId } = await fetchJson<{ jobId: string; status: string }>("/api/audio/convert", {
    method: "POST",
    body: JSON.stringify({
      url: params.url,
      format: params.formatId.toLowerCase(),
      quality: params.qualityId,
      normalize: params.normalize,
    }),
  });

  const result = await pollJob<BackendAudioConvertResult>(jobId, onProgress);
  return {
    filename: result.filename,
    formatLabel: result.formatLabel,
    qualityLabel: result.qualityLabel,
    durationLabel: result.durationLabel,
    sizeLabel: result.sizeLabel,
    downloadUrl: `${API_BASE_URL}${result.downloadUrl}`,
  };
}

// ---------------------------------------------------------------------------
// Image Converter
// ---------------------------------------------------------------------------

interface BackendImageConvertResponse {
  success: true;
  original: { filename: string; format: string; width: number; height: number; size: number };
  output: { format: string; width: number; height: number; size: number; downloadUrl: string };
}

/**
 * POST /api/image/convert (multipart upload). Uses XMLHttpRequest instead of
 * fetch so real upload progress events are available for the progress bar.
 */
export function convertImage(
  params: {
    file: File;
    format: ImageFormatId;
    quality: number;
    width: number;
    height: number;
    keepAspectRatio: boolean;
  },
  onProgress?: (percent: number) => void,
): Promise<ImageResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("image", params.file, params.file.name);
    formData.append("format", params.format.toLowerCase());
    formData.append("quality", String(params.quality));
    formData.append("width", String(params.width));
    formData.append("height", String(params.height));
    formData.append("keepAspectRatio", String(params.keepAspectRatio));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/api/image/convert`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        // Reserve the top of the bar for server-side processing time, which
        // has no progress events of its own in this synchronous endpoint.
        onProgress?.(Math.round((event.loaded / event.total) * 70));
      }
    };

    xhr.onload = () => {
      let body: BackendImageConvertResponse | Partial<BackendErrorBody> | null = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // handled below
      }

      if (xhr.status >= 200 && xhr.status < 300 && body && (body as BackendImageConvertResponse).success) {
        onProgress?.(100);
        const { original, output } = body as BackendImageConvertResponse;
        const baseName = original.filename.replace(/\.[^./]+$/, "");
        const savedPercent = Math.max(0, Math.round((1 - output.size / original.size) * 100));
        resolve({
          beforeLabel: original.filename,
          beforeSizeLabel: formatBytes(original.size),
          afterLabel: `${baseName}.${output.format}`,
          afterSizeLabel: formatBytes(output.size),
          savedPercent,
          format: params.format,
          targetResolution: `${output.width}×${output.height}`,
          finalSizeLabel: formatBytes(output.size),
          outputUrl: `${API_BASE_URL}${output.downloadUrl}`,
        });
        return;
      }

      const errorBody = body as Partial<BackendErrorBody> | null;
      reject(
        new ApiError(
          errorBody?.error?.code ?? "IMAGE_CONVERT_FAILED",
          errorBody?.error?.message ?? "Could not convert this image.",
        ),
      );
    };

    xhr.onerror = () => {
      reject(new ApiError("NETWORK_ERROR", "Could not reach the ActionX API. Is the backend running?"));
    };

    onProgress?.(3);
    xhr.send(formData);
  });
}
