import { spawn } from "node:child_process";
import { config } from "../config.js";

export interface SpawnResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

/**
 * Runs a binary with an explicit argument array — never a shell string — so
 * user-controlled values (URLs, filenames) can never be interpreted as shell
 * syntax. `onLine` is called for every stdout line as it streams in, which is
 * how download/conversion progress gets parsed.
 */
function spawnSafe(
  binary: string,
  args: string[],
  options: { onStdoutLine?: (line: string) => void; timeoutMs?: number } = {},
): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let stdoutBuffer = "";

    const timeout = options.timeoutMs
      ? setTimeout(() => {
          child.kill("SIGKILL");
          reject(new Error(`${binary} timed out after ${options.timeoutMs}ms`));
        }, options.timeoutMs)
      : undefined;

    if (!child.stdout || !child.stderr) {
      reject(new Error(`Failed to open stdio pipes for ${binary}.`));
      return;
    }
    const stdoutStream = child.stdout;
    const stderrStream = child.stderr;

    stdoutStream.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      stdout += text;
      if (options.onStdoutLine) {
        stdoutBuffer += text;
        const lines = stdoutBuffer.split(/\r?\n/);
        stdoutBuffer = lines.pop() ?? "";
        for (const line of lines) options.onStdoutLine(line);
      }
    });
    stderrStream.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (err) => {
      if (timeout) clearTimeout(timeout);
      reject(err);
    });

    child.on("close", (code) => {
      if (timeout) clearTimeout(timeout);
      resolve({ code, stdout, stderr });
    });
  });
}

/** Checks whether a binary is reachable on PATH (or at the configured absolute path). */
export async function checkBinaryAvailable(binary: string, versionFlag = "-version"): Promise<boolean> {
  try {
    const result = await spawnSafe(binary, [versionFlag], { timeoutMs: 5000 });
    return result.code === 0;
  } catch {
    return false;
  }
}

export interface BinaryAvailability {
  ffmpeg: boolean;
  ffprobe: boolean;
  ytDlp: boolean;
}

export async function checkAllBinaries(): Promise<BinaryAvailability> {
  const [ffmpeg, ffprobe, ytDlp] = await Promise.all([
    checkBinaryAvailable(config.ffmpegPath, "-version"),
    checkBinaryAvailable(config.ffprobePath, "-version"),
    checkBinaryAvailable(config.ytDlpPath, "--version"),
  ]);
  return { ffmpeg, ffprobe, ytDlp };
}

/** Runs `yt-dlp -j <url>` and returns the parsed info JSON. Never downloads media. */
export async function ytDlpProbe(url: string): Promise<Record<string, unknown>> {
  const result = await spawnSafe(
    config.ytDlpPath,
    ["-j", "--no-warnings", "--no-playlist", "--no-call-home", url],
    { timeoutMs: 30_000 },
  );
  if (result.code !== 0) {
    throw new YtDlpError(result.stderr || "yt-dlp failed to read this URL.");
  }
  try {
    return JSON.parse(result.stdout.trim().split("\n").pop() ?? "{}");
  } catch {
    throw new YtDlpError("yt-dlp returned an unexpected response for this URL.");
  }
}

export class YtDlpError extends Error {
  constructor(public readonly rawStderr: string) {
    super(rawStderr);
    this.name = "YtDlpError";
  }
}

/** Maps a yt-dlp stderr blob to a stable, user-safe error code + message. */
export function classifyYtDlpError(rawStderr: string): { code: string; message: string } {
  const text = rawStderr.toLowerCase();
  if (text.includes("drm") || text.includes("protected")) {
    return { code: "DRM_PROTECTED", message: "This content is DRM-protected and cannot be processed." };
  }
  if (text.includes("private video") || text.includes("private playlist")) {
    return { code: "PRIVATE_CONTENT", message: "This content is private and cannot be accessed." };
  }
  if (text.includes("sign in") || text.includes("login required") || text.includes("cookies")) {
    return { code: "AUTH_REQUIRED", message: "This content requires sign-in and cannot be accessed." };
  }
  if (text.includes("unsupported url") || text.includes("no extractor")) {
    return { code: "UNSUPPORTED_SOURCE", message: "This URL is not from a supported source." };
  }
  if (text.includes("video unavailable") || text.includes("this video is not available")) {
    return { code: "MEDIA_UNAVAILABLE", message: "This media is unavailable." };
  }
  if (text.includes("age")) {
    return { code: "AGE_RESTRICTED", message: "This content is age-restricted and cannot be accessed." };
  }
  return {
    code: "SOURCE_PROCESSING_FAILED",
    message: "We couldn't process this link. Please check the URL and try again.",
  };
}

/** Downloads media via yt-dlp using a safe `-f` format selector, reporting 0–100 progress. */
export async function ytDlpDownload(params: {
  url: string;
  formatSelector: string;
  outputTemplate: string;
  mergeFormat?: string;
  audioOnly?: boolean;
  onProgress?: (percent: number) => void;
}): Promise<void> {
  const args = [
    "--no-warnings",
    "--no-playlist",
    "--no-call-home",
    "--newline",
    "-f",
    params.formatSelector,
    "-o",
    params.outputTemplate,
  ];
  if (params.mergeFormat) args.push("--merge-output-format", params.mergeFormat);
  if (params.audioOnly) args.push("-x");
  args.push(params.url);

  const progressPattern = /\[download\]\s+(\d{1,3}(?:\.\d+)?)%/;

  const result = await spawnSafe(config.ytDlpPath, args, {
    timeoutMs: 15 * 60 * 1000,
    onStdoutLine: (line) => {
      const match = progressPattern.exec(line);
      if (match) params.onProgress?.(Math.min(100, parseFloat(match[1])));
    },
  });

  if (result.code !== 0) {
    throw new YtDlpError(result.stderr);
  }
}

export interface ProbeInfo {
  durationSeconds: number;
  sampleRate: number | null;
  formatName: string | null;
}

/** Reads media metadata (duration, sample rate) from a local file via ffprobe. */
export async function ffprobeFile(absolutePath: string): Promise<ProbeInfo> {
  const result = await spawnSafe(
    config.ffprobePath,
    ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", absolutePath],
    { timeoutMs: 30_000 },
  );
  if (result.code !== 0) {
    throw new Error("ffprobe failed to read the media file.");
  }
  const parsed = JSON.parse(result.stdout || "{}") as {
    format?: { duration?: string; format_name?: string };
    streams?: Array<{ codec_type?: string; sample_rate?: string }>;
  };
  const audioStream = parsed.streams?.find((s) => s.codec_type === "audio");
  return {
    durationSeconds: parsed.format?.duration ? parseFloat(parsed.format.duration) : 0,
    sampleRate: audioStream?.sample_rate ? parseInt(audioStream.sample_rate, 10) : null,
    formatName: parsed.format?.format_name ?? null,
  };
}

/** Runs ffmpeg with an explicit argument array and `-progress pipe:1` for progress parsing. */
export async function runFfmpeg(params: {
  args: string[];
  totalDurationSeconds: number;
  onProgress?: (percent: number) => void;
}): Promise<void> {
  const fullArgs = ["-y", "-progress", "pipe:1", "-nostats", ...params.args];
  const timePattern = /out_time_ms=(\d+)/;

  const result = await spawnSafe(config.ffmpegPath, fullArgs, {
    timeoutMs: 15 * 60 * 1000,
    onStdoutLine: (line) => {
      const match = timePattern.exec(line);
      if (match && params.totalDurationSeconds > 0) {
        const outSeconds = parseInt(match[1], 10) / 1_000_000;
        const percent = Math.min(99, (outSeconds / params.totalDurationSeconds) * 100);
        params.onProgress?.(percent);
      }
    },
  });

  if (result.code !== 0) {
    throw new Error("ffmpeg failed to process the media file.");
  }
}