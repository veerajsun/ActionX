import type { FastifyInstance } from "fastify";
import { ApiError, Errors } from "../utils/errors.js";
import { imageConvertFieldsSchema } from "../utils/validation.js";
import { convertImage } from "../services/imageService.js";
import { config } from "../config.js";

interface RawFields {
  format?: string;
  quality?: string;
  width?: string;
  height?: string;
  keepAspectRatio?: string;
}

export async function imageRoutes(app: FastifyInstance) {
  app.post("/api/image/convert", async (request) => {
    if (!request.isMultipart()) {
      throw Errors.invalidInput("Expected a multipart/form-data upload.");
    }

    let fileBuffer: Buffer | null = null;
    let originalFilename = "image";
    const fields: RawFields = {};
    const knownFields = new Set(["format", "quality", "width", "height", "keepAspectRatio"]);

    try {
      for await (const part of request.parts()) {
        if (part.type === "file") {
          if (part.fieldname !== "image") continue;
          originalFilename = part.filename ?? originalFilename;
          fileBuffer = await part.toBuffer();
        } else if (knownFields.has(part.fieldname)) {
          (fields as Record<string, string>)[part.fieldname] = part.value as string;
        }
      }
    } catch (err) {
      const typed = err as Error & { code?: string };
      if (typed.code === "FST_REQ_FILE_TOO_LARGE" || typed.code === "FST_PARTS_LIMIT") {
        throw Errors.fileTooLarge(
          `The image exceeds the ${Math.round(config.maxImageFileSizeBytes / (1024 * 1024))}MB limit.`,
        );
      }
      throw Errors.invalidInput("Could not read the uploaded file.");
    }

    if (!fileBuffer) throw Errors.invalidInput("No image file was uploaded.");
    if (fileBuffer.length > config.maxImageFileSizeBytes) {
      throw Errors.fileTooLarge(
        `The image exceeds the ${Math.round(config.maxImageFileSizeBytes / (1024 * 1024))}MB limit.`,
      );
    }

    const parsed = imageConvertFieldsSchema.safeParse(fields);
    if (!parsed.success) throw Errors.invalidInput(parsed.error.issues[0]?.message ?? "Invalid input.");

    request.log.info(
      { filename: originalFilename, format: parsed.data.format, size: fileBuffer.length },
      "Image convert requested",
    );

    try {
      const result = await convertImage({
        buffer: fileBuffer,
        originalFilename,
        format: parsed.data.format,
        quality: parsed.data.quality,
        width: parsed.data.width,
        height: parsed.data.height,
        keepAspectRatio: parsed.data.keepAspectRatio,
      });
      return result;
    } catch (err) {
      const typed = err as Error;
      throw new ApiError(422, "IMAGE_CONVERT_FAILED", typed.message || "Could not convert this image.");
    }
  });
}
