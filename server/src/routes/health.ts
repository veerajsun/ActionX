import type { FastifyInstance } from "fastify";
import { checkAllBinaries } from "../services/mediaService.js";

const SERVICE_VERSION = "1.0.0";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/api/health", async () => {
    const binaries = await checkAllBinaries();
    return {
      status: "ok",
      service: "ActionX API",
      version: SERVICE_VERSION,
      binaries,
    };
  });
}
