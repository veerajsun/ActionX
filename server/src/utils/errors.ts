import type { FastifyReply, FastifyRequest } from "fastify";

/** Thrown anywhere in a route/service to produce a consistent JSON error response. */
export class ApiError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const Errors = {
  invalidInput: (message: string) => new ApiError(400, "INVALID_INPUT", message),
  invalidUrl: (message = "The provided URL is not supported.") =>
    new ApiError(400, "INVALID_URL", message),
  notFound: (message: string) => new ApiError(404, "NOT_FOUND", message),
  fileTooLarge: (message: string) => new ApiError(413, "FILE_TOO_LARGE", message),
  rateLimited: (message = "Too many requests. Please slow down.") =>
    new ApiError(429, "RATE_LIMITED", message),
  processingFailed: (message: string) => new ApiError(500, "PROCESSING_FAILED", message),
  serviceUnavailable: (message: string) => new ApiError(503, "SERVICE_UNAVAILABLE", message),
};

/** Registered as Fastify's global error handler. Never leaks stack traces to the client. */
export function apiErrorHandler(
  error: Error & { statusCode?: number; validation?: unknown },
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (error instanceof ApiError) {
    request.log.warn({ code: error.code, statusCode: error.statusCode }, error.message);
    return reply.status(error.statusCode).send({
      success: false,
      error: { code: error.code, message: error.message },
    });
  }

  // Zod / Fastify schema validation errors.
  if (error.validation) {
    request.log.warn({ validation: error.validation }, "Request validation failed");
    return reply.status(400).send({
      success: false,
      error: { code: "INVALID_INPUT", message: "Request validation failed." },
    });
  }

  // Fastify's built-in payload-too-large error.
  if (error.statusCode === 413) {
    return reply.status(413).send({
      success: false,
      error: { code: "FILE_TOO_LARGE", message: "The uploaded file exceeds the size limit." },
    });
  }

  request.log.error(error, "Unhandled error");
  return reply.status(500).send({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
  });
}
