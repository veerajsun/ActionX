import { test } from "node:test";
import assert from "node:assert/strict";
import { checkMediaUrl, imageConvertFieldsSchema } from "./validation.js";

test("checkMediaUrl accepts a normal https URL", () => {
  const result = checkMediaUrl("https://example.com/watch?v=abc123");
  assert.equal(result.ok, true);
});

test("checkMediaUrl rejects non-http(s) protocols", () => {
  const result = checkMediaUrl("file:///etc/passwd");
  assert.equal(result.ok, false);
});

test("checkMediaUrl rejects localhost (SSRF guard)", () => {
  assert.equal(checkMediaUrl("http://localhost:8080/internal").ok, false);
  assert.equal(checkMediaUrl("http://127.0.0.1/admin").ok, false);
});

test("checkMediaUrl rejects private IP ranges (SSRF guard)", () => {
  assert.equal(checkMediaUrl("http://10.0.0.5/").ok, false);
  assert.equal(checkMediaUrl("http://192.168.1.1/").ok, false);
  assert.equal(checkMediaUrl("http://169.254.169.254/latest/meta-data").ok, false);
});

test("checkMediaUrl rejects URLs with embedded credentials", () => {
  assert.equal(checkMediaUrl("https://user:pass@example.com/video").ok, false);
});

test("checkMediaUrl rejects malformed URLs", () => {
  assert.equal(checkMediaUrl("not a url").ok, false);
});

test("imageConvertFieldsSchema accepts a valid payload", () => {
  const parsed = imageConvertFieldsSchema.safeParse({
    format: "webp",
    quality: "85",
    width: "1920",
    height: "1080",
    keepAspectRatio: "true",
  });
  assert.equal(parsed.success, true);
});

test("imageConvertFieldsSchema rejects an unsupported format", () => {
  const parsed = imageConvertFieldsSchema.safeParse({ format: "psd" });
  assert.equal(parsed.success, false);
});

test("imageConvertFieldsSchema rejects an out-of-range quality", () => {
  const parsed = imageConvertFieldsSchema.safeParse({ format: "jpg", quality: "150" });
  assert.equal(parsed.success, false);
});

test("imageConvertFieldsSchema parses the string 'false' as boolean false", () => {
  // Regression check: z.coerce.boolean() would treat "false" as truthy
  // (Boolean("false") === true) since it's a non-empty string.
  const parsed = imageConvertFieldsSchema.safeParse({ format: "png", keepAspectRatio: "false" });
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.keepAspectRatio, false);
});

test("imageConvertFieldsSchema parses the string 'true' as boolean true", () => {
  const parsed = imageConvertFieldsSchema.safeParse({ format: "png", keepAspectRatio: "true" });
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.keepAspectRatio, true);
});
