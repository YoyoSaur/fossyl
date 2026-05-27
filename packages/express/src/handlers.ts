import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { Route, RequestExtractor, ResponseData } from "@fossyl/core";
import { executeRoute } from "@fossyl/core";
import { requestContext, type RequestContext, createDefaultLogger } from "./context";
import { wrapResponse } from "./response";
import { handleError } from "./errors";
import type { ExpressAdapterOptions } from "./types";

const expressExtractor: RequestExtractor<Request> = {
  params: (req) => ({
    url: req.params as Record<string, string>,
    query: req.query as Record<string, string>,
  }),
  headers: (req) => req.headers as Record<string, string>,
  body: (req) => req.body,
};

export function createHandler(route: Route, options: ExpressAdapterOptions): RequestHandler {
  const isPaginated = !!route.paginationConfig;

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

    try {
      const result = await requestContext.run(ctx, async () => {
        return executeRoute(route, req, expressExtractor, options.database);
      });

      if (isPaginated) {
        res.json(result);
      } else {
        res.json(wrapResponse(result as ResponseData));
      }

      options.metrics?.onRequestEnd({
        ...metricsInfo,
        statusCode: 200,
        durationMs: Date.now() - startTime,
      });
    } catch (error) {
      handleError(error, res, logger);
      options.metrics?.onRequestError({
        ...metricsInfo,
        error: error instanceof Error ? error : new Error(String(error)),
        durationMs: Date.now() - startTime,
      });
    }
  };
}
