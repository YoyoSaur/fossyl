import {
  PaginationConfig,
  Route,
  Authentication,
  RestMethod,
  PaginationParams,
  Steps,
  RequestExtractor,
} from "./types/routes.types";
import {
  AuthenticatedRouter,
  AuthenticationFunction,
  ValidatorFunction,
  Endpoint,
  OpenRouter,
  FullRouter,
  ValidatedRouter,
  PaginatedRouter,
  QueryableRouter,
  Router,
} from "./types/router-creation.types";
import { EndpointParams } from "./types/params.types";
import { DatabaseAdapter } from "../adapters";
import { fossylValidationError } from "./errors";

type BuildMethodsState = {
  steps: Steps[];
  authenticator?: AuthenticationFunction<any>;
  validator?: ValidatorFunction<any>;
  queryValidator?: ValidatorFunction<any>;
  paginationConfig?: PaginationConfig;
  hasTransaction?: boolean;
};

function buildMethods(path: string, state: BuildMethodsState) {
  const { hasTransaction: stateTransaction } = state;

  const make = (method: RestMethod) => (handler: Function) => {
    const hasTransaction = stateTransaction ?? method !== "GET";
    return {
      path,
      method,
      ...state,
      hasTransaction,
      handler,
    } satisfies Route;
  };
  return {
    get: make("GET"),
    post: make("POST"),
    put: make("PUT"),
    delete: make("DELETE"),
  };
}

function fullBuilder<
  P extends EndpointParams<string, unknown | undefined, PaginationParams | undefined>,
  Auth extends Authentication,
  Body extends unknown,
>(path: string, state: BuildMethodsState): FullRouter<P, Body, Auth> {
  return {
    ...buildMethods(path, state),
  };
}

function validatedBuilder<
  P extends EndpointParams<string, unknown | undefined, PaginationParams | undefined>,
  Body extends unknown,
>(path: string, state: BuildMethodsState): ValidatedRouter<P, Body> {
  return {
    ...buildMethods(path, state),
  };
}

function authenticatedBuilder<
  P extends EndpointParams<string, unknown | undefined, PaginationParams | undefined>,
  Auth extends Authentication,
>(path: string, state: BuildMethodsState): AuthenticatedRouter<P, Auth> {
  return {
    validator: <Body>(validatorFunction: ValidatorFunction<Body>) =>
      fullBuilder<P, Auth, Body>(path, {
        ...state,
        steps: state.steps.concat("body"),
        validator: validatorFunction,
      }),
    ...buildMethods(path, state),
  };
}

function openBuilder<
  P extends EndpointParams<string, unknown | undefined, PaginationParams | undefined>,
>(path: string, state: BuildMethodsState): OpenRouter<P> {
  return {
    authenticator: (authenticatorFunction: AuthenticationFunction<any>) =>
      authenticatedBuilder(path, {
        ...state,
        steps: state.steps.concat("headers"),
        authenticator: authenticatorFunction,
      }),
    validator: (validatorFunction: ValidatorFunction<any>) =>
      validatedBuilder(path, {
        ...state,
        steps: state.steps.concat("body"),
        validator: validatorFunction,
      }),
    ...buildMethods(path, state),
  };
}

function paginatedBuilder<P extends EndpointParams<string, unknown | undefined, PaginationParams>>(
  path: string,
  state: BuildMethodsState
): PaginatedRouter<P> {
  return {
    ...openBuilder<P>(path, { ...state, steps: ["params"] }),
  };
}

function queryableBuilder<P extends EndpointParams<string, unknown, undefined>>(
  path: string,
  state: BuildMethodsState
): QueryableRouter<EndpointParams<P["path"], P["query"]>> {
  return {
    paginate: (paginationConfig: PaginationConfig) =>
      paginatedBuilder<EndpointParams<P["path"], P["query"], PaginationParams>>(path, {
        ...state,
        steps: ["params"],
        paginationConfig,
      }),
    ...openBuilder(path, state),
  };
}

function endpointBuilder<Path extends string>(
  path: Path,
  state: BuildMethodsState
): Endpoint<Path, true> | Endpoint<Path, false> {
  const endpoint = {
    query: <Query extends unknown>(queryValidator: ValidatorFunction<Query>) =>
      queryableBuilder<EndpointParams<Path, Query>>(path, {
        ...state,
        steps: ["params"],
        queryValidator,
      }),
    paginate: (paginationConfig: PaginationConfig) =>
      paginatedBuilder<EndpointParams<Path, undefined, PaginationParams>>(path, {
        ...state,
        steps: ["params"],
        paginationConfig,
      }),
    ...openBuilder(path, state),
  } satisfies Endpoint<Path, false>;
  if (!state.hasTransaction) {
    return endpoint;
  }
  return {
    ...endpoint,
    noTransaction: () =>
      endpointBuilder(path, {
        ...state,
        hasTransaction: false,
      }),
  } as Endpoint<Path, true>;
}

function createEndpoint<Path extends string>(path: Path): Endpoint<Path> {
  return endpointBuilder(path, {
    steps: path.includes(":") ? ["params"] : [],
    authenticator: undefined,
    validator: undefined,
    queryValidator: undefined,
    paginationConfig: undefined,
    hasTransaction: true,
  });
}

function parseQueryParams(
  route: Route,
  query: Record<string, string>
): {
  query?: Record<string, string>;
  pagination?: PaginationParams;
} {
  const { maxPageSize, defaultPageSize } = route.paginationConfig || {};
  const { page: pageParam, pageSize: pageSizeParam, ...rest } = query;
  const page = pageParam ? Number(pageParam) : undefined;
  const pageSize = pageSizeParam ? Number(pageSizeParam) : defaultPageSize;
  if (pageSize && maxPageSize && pageSize > maxPageSize) {
    throw fossylValidationError(
      `Page size ${pageSize} is greater than the maximum page size of ${maxPageSize}`
    );
  }
  return {
    query: Object.keys(rest).length === 0 ? undefined : rest,
    pagination:
      pageSize && page
        ? {
            page: Number(page),
            pageSize: Number(pageSize),
          }
        : undefined,
  };
}

async function getStepArg<TReq>(
  step: Steps,
  route: Route,
  req: TReq,
  extract: RequestExtractor<TReq>
) {
  switch (step) {
    case "params":
      const raw = extract.params(req);
      const { query, pagination } = parseQueryParams(route, raw.query);
      return {
        url: raw.url,
        query: route.queryValidator?.(query),
        pagination,
      };
    case "headers":
      return route.authenticator!(extract.headers(req));
    case "body":
      return route.validator!(extract.body(req));
  }
}

export async function executeRoute<TReq>(
  route: Route,
  req: TReq,
  extract: RequestExtractor<TReq>,
  db?: DatabaseAdapter
): Promise<unknown> {
  const exec = await route.steps.reduce(async (fnPromise, step) => {
    const fn = await fnPromise;
    const arg = await getStepArg(step, route, req, extract);
    return fn(arg);
  }, Promise.resolve(route.handler));
  if (!db) {
    return exec();
  }
  if (!route.hasTransaction) {
    return db.withClient(exec);
  }
  return db.withTransaction(exec);
}

/**
 * Provides an Ednpoint creater. Would maybe like some other internal stuff? Lowkey... I think we
 * all might just end up using the helper functions of get and del and such.
 * @param _ - this param is still needed because the type is determined at compile time.
 */
export function createRouter<BasePath extends string>(_: BasePath): Router<BasePath> {
  return {
    createEndpoint: <Path extends `${BasePath}${string}`>(path: Path) => createEndpoint(path),
    createSubrouter: <Path extends `${BasePath}${string}`>(path: Path) => createRouter(path),
  };
}
