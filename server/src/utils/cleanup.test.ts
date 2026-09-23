import { test } from "node:test";
import assert from "node:assert/strict";
import { getTempFile, isExpired, registerTempFile } from "./cleanup.js";

test("registerTempFile stores an entry retrievable by id", () => {
  const entry = registerTempFile({
    id: "test-file-1",
    absolutePath: "/tmp/does-not-need-to-exist-for-this-test.txt",
    filename: "example.txt",
    mimeType: "text/plain",
    expiresAt: Date.now() + 60_000,
  });
  assert.equal(getTempFile("test-file-1")?.id, entry.id);
});

test("getTempFile returns undefined for an unknown id", () => {
  assert.equal(getTempFile("does-not-exist"), undefined);
});

test("isExpired is false for a future expiry and true for a past one", () => {
  const future = registerTempFile({
    id: "test-file-future",
    absolutePath: "/tmp/x.txt",
    filename: "x.txt",
    mimeType: "text/plain",
    expiresAt: Date.now() + 60_000,
  });
  const past = registerTempFile({
    id: "test-file-past",
    absolutePath: "/tmp/y.txt",
    filename: "y.txt",
    mimeType: "text/plain",
    expiresAt: Date.now() - 1,
  });
  assert.equal(isExpired(future), false);
  assert.equal(isExpired(past), true);
});
