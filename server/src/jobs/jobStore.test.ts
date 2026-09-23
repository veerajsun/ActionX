import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createJob,
  getJob,
  markJobCompleted,
  markJobFailed,
  markJobProcessing,
} from "./jobStore.js";

test("createJob starts a job in the queued state with 0 progress", () => {
  const job = createJob("video-download");
  assert.equal(job.status, "queued");
  assert.equal(job.progress, 0);
  assert.ok(job.id);
});

test("getJob returns undefined for an unknown id", () => {
  assert.equal(getJob("00000000-0000-0000-0000-000000000000"), undefined);
});

test("markJobProcessing updates status and progress", () => {
  const job = createJob("audio-convert");
  const updated = markJobProcessing(job.id, 42, "Transcoding...");
  assert.equal(updated?.status, "processing");
  assert.equal(updated?.progress, 42);
  assert.equal(updated?.message, "Transcoding...");
});

test("markJobCompleted sets progress to 100 and stores the result", () => {
  const job = createJob("video-download");
  const result = { filename: "clip.mp4", downloadUrl: "/api/download/abc" };
  const updated = markJobCompleted(job.id, result);
  assert.equal(updated?.status, "completed");
  assert.equal(updated?.progress, 100);
  assert.deepEqual(updated?.result, result);
});

test("markJobFailed records a structured error", () => {
  const job = createJob("video-download");
  const updated = markJobFailed(job.id, { code: "MEDIA_UNAVAILABLE", message: "Not found." });
  assert.equal(updated?.status, "failed");
  assert.equal(updated?.error?.code, "MEDIA_UNAVAILABLE");
});

test("updating an unknown job id is a no-op that returns undefined", () => {
  const result = markJobProcessing("00000000-0000-0000-0000-000000000000", 50);
  assert.equal(result, undefined);
});
