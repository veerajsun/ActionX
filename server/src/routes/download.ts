import { createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Errors } from "../utils/errors.js";
import { getTempFile, isExpired } from "../utils/cleanup.js";

const paramsSchema = z.object({ fileId: z.string().uuid() });

export async function downloadRoutes(app: FastifyInstance) {
  app.get("/api/download/:fileId", async (request, reply) => {
    const parsed = paramsSchema.safeParse(request.params);
    if (!parsed.success) throw Errors.notFound("This file does not exist or has expired.");

    // fileId is always a server-generated UUID (see generateFileId), and the
    // registry maps it to an absolute path we chose — the client can never
    // supply or influence a filesystem path directly.
    const entry = getTempFile(parsed.data.fileId);
    if (!entry || isExpired(entry)) {
      throw Errors.notFound("This file does not exist or has expired.");
    }

    let stat;
    try {
      stat = await fs.stat(entry.absolutePath);
    } catch {
      throw Errors.notFound("This file does not exist or has expired.");
    }

    reply.header("Content-Type", entry.mimeType);
    reply.header("Content-Length", stat.size);
    reply.header("Content-Disposition", `attachment; filename="${entry.filename}"`);
    reply.header("Cache-Control", "private, max-age=0, no-cache");

    return reply.send(createReadStream(entry.absolutePath));
  });
}
