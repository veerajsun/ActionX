import { promises as fs } from "node:fs";
import sharp from "sharp";
import { config } from "../config.js";
import { registerTempFile } from "../utils/cleanup.js";
import { generateFileId, resolveTempPath, safeUnlink, sanitizeFilename } from "../utils/files.js";
import type { ImageOutputFormat } from "../utils/validation.js";
import type { ImageConvertResult } from "../types/media.js";
import { runFfmpeg } from "./mediaService.js";

const MIME_BY_FORMAT: Record<ImageOutputFormat, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  tiff: "image/tiff",
};

/**
 * sharp/libvips has no BMP encoder. For that one format we render a PNG with
 * sharp and hand it to ffmpeg (which does support BMP) for the final encode.
 */
async function encodePngBufferAsBmp(pngBuffer: Buffer): Promise<Buffer> {
  const pngId = generateFileId();
  const bmpId = generateFileId();
  const pngPath = resolveTempPath(pngId, ".png");
  const bmpPath = resolveTempPath(bmpId, ".bmp");

  await fs.writeFile(pngPath, pngBuffer);
  try {
    await runFfmpeg({ args: ["-i", pngPath, bmpPath], totalDurationSeconds: 0 });
    return await fs.readFile(bmpPath);
  } finally {
    await safeUnlink(pngPath);
    await safeUnlink(bmpPath);
  }
}

export async function convertImage(params: {
  buffer: Buffer;
  originalFilename: string;
  format: ImageOutputFormat;
  quality: number;
  width?: number;
  height?: number;
  keepAspectRatio: boolean;
}): Promise<ImageConvertResult> {
  let source: sharp.Sharp;
  let metadata: sharp.Metadata;
  try {
    source = sharp(params.buffer, { failOn: "error" });
    metadata = await source.metadata();
  } catch {
    throw new Error("The uploaded file is not a valid, supported image.");
  }

  const originalWidth = metadata.width ?? 0;
  const originalHeight = metadata.height ?? 0;

  const wantsResize =
    params.width !== undefined &&
    params.height !== undefined &&
    (params.width !== originalWidth || params.height !== originalHeight);

  let pipeline = source;
  if (wantsResize) {
    pipeline = pipeline.resize(params.width, params.height, {
      fit: params.keepAspectRatio ? "inside" : "fill",
      withoutEnlargement: false,
    });
  }

  const normalizedFormat = params.format === "jpg" ? "jpeg" : params.format;
  let outputBuffer: Buffer;
  let outWidth = params.width ?? originalWidth;
  let outHeight = params.height ?? originalHeight;

  switch (normalizedFormat) {
    case "jpeg": {
      const { data, info } = await pipeline.jpeg({ quality: params.quality }).toBuffer({ resolveWithObject: true });
      outputBuffer = data;
      outWidth = info.width;
      outHeight = info.height;
      break;
    }
    case "png": {
      const { data, info } = await pipeline
        .png({ quality: params.quality, compressionLevel: 9 })
        .toBuffer({ resolveWithObject: true });
      outputBuffer = data;
      outWidth = info.width;
      outHeight = info.height;
      break;
    }
    case "webp": {
      const { data, info } = await pipeline.webp({ quality: params.quality }).toBuffer({ resolveWithObject: true });
      outputBuffer = data;
      outWidth = info.width;
      outHeight = info.height;
      break;
    }
    case "tiff": {
      const { data, info } = await pipeline.tiff({ quality: params.quality }).toBuffer({ resolveWithObject: true });
      outputBuffer = data;
      outWidth = info.width;
      outHeight = info.height;
      break;
    }
    case "gif": {
      const { data, info } = await pipeline.gif().toBuffer({ resolveWithObject: true });
      outputBuffer = data;
      outWidth = info.width;
      outHeight = info.height;
      break;
    }
    case "bmp": {
      const { data, info } = await pipeline.png().toBuffer({ resolveWithObject: true });
      outputBuffer = await encodePngBufferAsBmp(data);
      outWidth = info.width;
      outHeight = info.height;
      break;
    }
    default:
      throw new Error(`Unsupported output format: ${params.format}`);
  }

  const fileId = generateFileId();
  const outPath = resolveTempPath(fileId, `.${params.format}`);
  await fs.writeFile(outPath, outputBuffer);

  const safeName = sanitizeFilename(params.originalFilename).replace(/\.[^./]+$/, "");
  const stored = registerTempFile({
    id: fileId,
    absolutePath: outPath,
    filename: `${safeName}.${params.format}`,
    mimeType: MIME_BY_FORMAT[params.format],
    expiresAt: Date.now() + config.imageFileRetentionMs,
  });

  return {
    success: true,
    original: {
      filename: sanitizeFilename(params.originalFilename),
      format: metadata.format ?? "unknown",
      width: originalWidth,
      height: originalHeight,
      size: params.buffer.length,
    },
    output: {
      format: params.format,
      width: outWidth,
      height: outHeight,
      size: outputBuffer.length,
      downloadUrl: `/api/download/${stored.id}`,
    },
  };
}
