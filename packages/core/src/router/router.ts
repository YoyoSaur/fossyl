import {
  PaginationConfig,
  Route,
  Authentication,
  RestMethod,
  PaginationParams,
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

/**
 * Creates an endpoint which can be used to create final routes from.
 * Routes must be fully qualified. This is provided as a helper function
 * @param path
 */

type BuildMethodsState = {
  steps: Array<"params" | "auth" | "body">;
  authenticator?: AuthenticationFunction<any>;
  validator?: ValidatorFunction<any>;
  queryValidator?: ValidatorFunction<any>;
  paginationConfig?: PaginationConfig;
  noTransaction?: boolean;
};

function buildMethods(path: string, state: BuildMethodsState) {
  const make = (method: RestMethod) => (handler: Function) =>
    ({
      path,
      method,
      ...state,
      handler,
    }) satisfies Route;
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
        steps: state.steps.concat("auth"),
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

function paginatedBuidler<P extends EndpointParams<string, unknown | undefined, PaginationParams>>(
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
      paginatedBuidler<EndpointParams<P["path"], P["query"], PaginationParams>>(path, {
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
): Endpoint<Path> {
  return {
    query: <Query extends unknown>(queryValidator: ValidatorFunction<Query>) =>
      queryableBuilder<EndpointParams<Path, Query>>(path, {
        ...state,
        steps: ["params"],
        queryValidator,
      }),
    paginate: (paginationConfig: PaginationConfig) =>
      paginatedBuidler<EndpointParams<Path, undefined, PaginationParams>>(path, {
        ...state,
        steps: ["params"],
        paginationConfig,
      }),
    ...openBuilder(path, state),
  };
}

function createEndpoint<Path extends string>(path: Path): Endpoint<Path> {
  return endpointBuilder(path, {
    steps: path.includes(":") ? ["params"] : [],
    authenticator: undefined,
    validator: undefined,
    queryValidator: undefined,
    paginationConfig: undefined,
    noTransaction: undefined,
  });
}

// async function executeRoute<TReq>(
//   route: Route, req: TReq,
//   extract: RequestExtractor<TReq>,
//   db?: DatabaseAdapter,
// ): Promise<unknown> {
//   const exec = await route.steps.reduce(async (fnPromise, step) => {
//     const fn = await fnPromise;
//     const arg = await /* dispatch[step] or switch */;
//     return fn(arg);
//   }, Promise.resolve(route.handler));
//   if (db && !route.noTransaction) {
//     const wrap = route.steps.includes("body")
//       ? db.withTransaction : db.withClient;
//     return wrap(exec);
//   }
//   return exec();
// }

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
