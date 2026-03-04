import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { StreamEvent, StreamOpenRoute, StreamAuthenticatedRoute } from "@fossyl/core";
import { requestContext, type RequestContext, createDefaultLogger } from "./context";
import type { ExpressAdapterOptions } from "./types";

type StreamRoute =
  | StreamOpenRoute<string, StreamEvent, any>
  | StreamAuthenticatedRoute<string, StreamEvent, any, any>;

/**
 * Formats a StreamEvent into SSE wire format.
 *
 * SSE frame format:
 *   event: <eventName>\n
 *   data: <json>\n
 *   \n
 *
 * The double newline at the end terminates the frame.
 */
export function formatSSEFrame(event: StreamEvent): string {
  const lines: string[] = [];
  if (event.eventName) lines.push(`event: ${event.eventName}`);
  lines.push(`data: ${JSON.stringify(event.data)}`);
  lines.push("", ""); // double newline terminates SSE frame
  return lines.join("\n");
}

/**
 * Creates an Express request handler for SSE stream routes.
 *
 * Analogous to createHandler() for unary routes, but:
 * - Sets SSE headers (Content-Type: text/event-stream)
 * - Iterates AsyncIterable<StreamEvent> with for-await-of
 * - Writes each event as formatSSEFrame(event) to res
 * - Wires AbortSignal to req.on('close') for cooperative cancellation
 * - Uses formatSSEFrame() for each event instead of a JSON response wrapper
 */
export function createStreamHandler(
  route: StreamRoute,
  options: ExpressAdapterOptions
): RequestHandler {
  return async (req: Request, res: Response, _next: NextFunction) => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const logger = options.logger?.createLogger(requestId) ?? createDefaultLogger(requestId);

    const ctx: RequestContext = {
      requestId,
      logger,
      databaseContext: undefined,
    };

    const metricsInfo = { method: req.method, path: route.path, requestId };
    options.metrics?.onRequestStart(metricsInfo);

    // SSE headers must be set before any writes
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // AbortController wired to client disconnect for cooperative cancellation
    const controller = new AbortController();
    req.on("close", () => controller.abort());

    try {
      await requestContext.run(ctx, async () => {
        const params = { url: req.params, query: req.query, signal: controller.signal };

        if (route.type === "stream-authenticated") {
          const auth = await route.authenticator(req.headers as Record<string, string>);
          for await (const event of route.handler(params as any, auth)) {
            if (!res.writableEnded) {
              res.write(formatSSEFrame(event));
            }
          }
        } else {
          for await (const event of route.handler(params as any)) {
            if (!res.writableEnded) {
              res.write(formatSSEFrame(event));
            }
          }
        }

        options.metrics?.onRequestEnd({
          ...metricsInfo,
          statusCode: 200,
          durationMs: Date.now() - startTime,
        });
      });
    } catch (error) {
      logger.error("Stream handler error", {
        message: error instanceof Error ? error.message : String(error),
      });
      options.metrics?.onRequestError({
        ...metricsInfo,
        error: error instanceof Error ? error : new Error(String(error)),
        durationMs: Date.now() - startTime,
      });
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
  };
}
