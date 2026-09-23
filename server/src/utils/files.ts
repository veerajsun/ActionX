import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "../config.js";

export function generateFileId(): string {
  return randomUUID();
}

/** Strips path separators and control characters; keeps a short, safe display name. */
export function sanitizeFilename(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]+/g, "_");
  const trimmed = base.length > 150 ? base.slice(0, 150) : base;
  return trimmed || "file";
}

export async function ensureTempDir(): Promise<void> {
  await fs.mkdir(config.tempDir, { recursive: true });
}

/**
 * Resolves `${fileId}${ext}` inside the temp dir and throws if the result would
 * escape it — the only path traversal defense that actually matters here, since
 * fileId always comes from `generateFileId()` rather than user input.
 */
export function resolveTempPath(fileId: string, ext: string): string {
  const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, "");
  const candidate = path.resolve(config.tempDir, `${fileId}${safeExt}`);
  const root = path.resolve(config.tempDir) + path.sep;
  if (!candidate.startsWith(root)) {
    throw new Error("Resolved path escapes the temp directory.");
  }
  return candidate;
}

export async function fileExists(absolutePath: string): Promise<boolean> {
  try {
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

export async function safeUnlink(absolutePath: string): Promise<void> {
  try {
    await fs.unlink(absolutePath);
  } catch {
    // Already gone — fine.
  }
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : decimals)} ${units[exponent]}`;
}

/**
 * yt-dlp's `%(ext)s` output template means we don't know a raw download's
 * final extension ahead of time. This finds the file it actually produced.
 */
export async function findFileByPrefix(dir: string, prefix: string): Promise<string> {
  const entries = await fs.readdir(dir);
  const match = entries.find((name) => name.startsWith(prefix));
  if (!match) throw new Error(`No file found for id ${prefix}`);
  return path.join(dir, match);
}

export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = Math.floor(safeSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
