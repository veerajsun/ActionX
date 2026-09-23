/** Joins class name fragments, dropping falsy values. Small local stand-in for `clsx`. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Formats a byte count into a human readable size label (e.g. "8.4 MB"). */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : decimals)} ${units[exponent]}`;
}

/** Formats a seconds count into `mm:ss`. */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Very loose check used purely for the mock "Analyze" affordance. */
export function looksLikeUrl(value: string): boolean {
  return /^https?:\/\/.+/i.test(value.trim());
}

/**
 * Forces a real browser "Save As" download for a cross-origin URL (the
 * frontend and backend run on different ports/origins in dev, so a plain
 * `<a download>` won't reliably force a save). Fetches the resource as a
 * Blob, then clicks a temporary same-origin blob: link.
 */
export async function triggerBrowserDownload(url: string, filename: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}.`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
