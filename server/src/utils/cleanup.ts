import type { FastifyBaseLogger } from "fastify";
import type { StoredFile } from "../types/media.js";
import { safeUnlink } from "./files.js";

const registry = new Map<string, StoredFile>();

export function registerTempFile(entry: Omit<StoredFile, "createdAt">): StoredFile {
  const stored: StoredFile = { ...entry, createdAt: Date.now() };
  registry.set(stored.id, stored);
  return stored;
}

export function getTempFile(fileId: string): StoredFile | undefined {
  return registry.get(fileId);
}

export function isExpired(entry: StoredFile): boolean {
  return Date.now() > entry.expiresAt;
}

async function removeEntry(fileId: string): Promise<void> {
  const entry = registry.get(fileId);
  if (!entry) return;
  registry.delete(fileId);
  await safeUnlink(entry.absolutePath);
}

/**
 * Sweeps expired files off disk and out of the registry.
 * For local development an in-memory registry + interval sweep is fine.
 * Production should back this with a persistent store (see README) so
 * cleanup survives restarts and works across multiple server instances.
 */
export function startCleanupSweep(logger: FastifyBaseLogger, intervalMs = 60_000): NodeJS.Timeout {
  return setInterval(() => {
    const expired = [...registry.values()].filter(isExpired);
    if (expired.length === 0) return;
    void Promise.all(expired.map((entry) => removeEntry(entry.id))).then(() => {
      logger.info({ count: expired.length }, "Cleanup: removed expired temp files");
    });
  }, intervalMs);
}

export async function deleteTempFileNow(fileId: string): Promise<void> {
  await removeEntry(fileId);
}
