import type { Response } from "express";
import type { Logger } from "@fossyl/core";
import { isFossylError } from "@fossyl/core";

export function handleError(
  error: unknown,
  res: Response,
  logger: Logger,
  exposeDetails: boolean
): void {
  if (isFossylError(error)) {
    logger.warn(`${error.code}: ${error.message}`);
    const body: Record<string, unknown> = {
      code: error.code,
      message: error.message,
    };
    if (exposeDetails && error.details) {
      body.details = error.details;
    }
    res.status(error.httpStatus).json(body);
    return;
  }

  logger.error("Internal server error", {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  res.status(500).json({ code: "INTERNAL_ERROR", message: "Internal server error" });
}
