import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { Route, ResponseData, PaginatedResponse, PaginationParams } from "@fossyl/core";

type UnaryRoute = Exclude<Route, { type: "stream-open" | "stream-authenticated" }>;
import { requestContext, type RequestContext, createDefaultLogger } from "./context";
import { wrapResponse } from "./response";
import { handleError } from "./errors";
import type { ExpressAdapterOptions } from "./types";

/**
 * Parses pagination parameters from query string.
 * Applies defaults and bounds checking.
 */
function parsePagination(
  query: Record<string, unknown>,
  config?: { defaultPageSize?: number; maxPageSize?: number }
): PaginationParams {
  const defaultPageSize = config?.defaultPageSize ?? 20;
  const maxPageSize = config?.maxPageSize ?? 100;

  const page = Math.max(1, parseInt(String(query.page)) || 1);
  const pageSize = Math.min(
    maxPageSize,
    Math.max(1, parseInt(String(query.pageSize)) || defaultPageSize)
  );

  return { page, pageSize };
}

/**
 * Strips pagination params from query object.
 */
function stripPaginationFromQuery(query: Record<string, unknown>): Record<string, unknown> {
  const { page: _, pageSize: __, ...rest } = query;
  return rest;
}

/**
 * Creates an Express request handler for a fossyl route.
 */
export function createHandler(route: Route, options: ExpressAdapterOptions): RequestHandler {
  const isListRoute = route.type === "list" || route.type === "authenticated-list";

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
        return executeRoute(route as UnaryRoute, req, options);
      });

      // List routes return PaginatedResponse directly, others get wrapped
      if (isListRoute) {
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

/**
 * Executes a route handler based on route type.
 */
async function executeRoute(
  route: UnaryRoute,
  req: Request,
  options: ExpressAdapterOptions
): Promise<ResponseData | PaginatedResponse<unknown>> {
  const params = { url: req.params, query: req.query };

  switch (route.type) {
    case "full": {
      const auth = await route.authenticator(req.headers as Record<string, string>);
      const body = route.validator(req.body);

      return options.database
        ? options.database.withTransaction(() => route.handler(params, auth, body))
        : route.handler(params, auth, body);
    }

    case "authenticated": {
      const auth = await route.authenticator(req.headers as Record<string, string>);

      return options.database
        ? options.database.withClient(() => route.handler(params, auth))
        : route.handler(params, auth);
    }

    case "validated": {
      const body = route.validator(req.body);

      return options.database
        ? options.database.withTransaction(() => route.handler(params, body))
        : route.handler(params, body);
    }

    case "open": {
      return options.database
        ? options.database.withClient(() => route.handler(params))
        : route.handler(params);
    }

    case "list": {
      const pagination = parsePagination(
        req.query as Record<string, unknown>,
        route.paginationConfig
      );
      const strippedQuery = stripPaginationFromQuery(req.query as Record<string, unknown>);
      const query = route.queryValidator ? route.queryValidator(strippedQuery) : undefined;
      const listParams = { url: req.params, query, pagination };

      return options.database
        ? options.database.withClient(() => route.handler(listParams))
        : route.handler(listParams);
    }

    case "authenticated-list": {
      const auth = await route.authenticator(req.headers as Record<string, string>);
      const pagination = parsePagination(
        req.query as Record<string, unknown>,
        route.paginationConfig
      );
      const strippedQuery = stripPaginationFromQuery(req.query as Record<string, unknown>);
      const query = route.queryValidator ? route.queryValidator(strippedQuery) : undefined;
      const listParams = { url: req.params, query, pagination };

      return options.database
        ? options.database.withClient(() => route.handler(listParams, auth))
        : route.handler(listParams, auth);
    }

    default: {
      const _exhaustive: never = route;
      throw new Error(`Unhandled route type: ${(_exhaustive as any).type}`);
    }
  }
}
