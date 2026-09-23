import { test } from "node:test";
import assert from "node:assert/strict";
import { formatBytes, formatDuration, resolveTempPath, sanitizeFilename } from "./files.js";

test("sanitizeFilename strips directory components", () => {
  assert.equal(sanitizeFilename("../../etc/passwd"), "passwd");
  assert.equal(sanitizeFilename("..\\..\\windows\\system32\\config"), "config");
});

test("sanitizeFilename strips unsafe characters", () => {
  assert.equal(sanitizeFilename('weird<>:"|?*name.png'), "weird_______name.png");
});

test("sanitizeFilename falls back to a safe default for empty input", () => {
  assert.equal(sanitizeFilename(""), "file");
});

test("resolveTempPath stays within the temp directory for a normal id", () => {
  const resolved = resolveTempPath("11111111-1111-1111-1111-111111111111", ".mp4");
  assert.ok(resolved.endsWith("11111111-1111-1111-1111-111111111111.mp4"));
});

test("resolveTempPath rejects a path-traversal id", () => {
  assert.throws(() => resolveTempPath("../../etc/passwd", ".mp4"));
});

test("formatBytes renders human-readable sizes", () => {
  assert.equal(formatBytes(0), "0 B");
  assert.equal(formatBytes(1024), "1 KB");
  assert.equal(formatBytes(1_500_000), "1.4 MB");
});

test("formatDuration renders mm:ss", () => {
  assert.equal(formatDuration(65), "1:05");
  assert.equal(formatDuration(0), "0:00");
  assert.equal(formatDuration(-5), "0:00");
});
