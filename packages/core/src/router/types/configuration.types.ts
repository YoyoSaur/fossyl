import { Params } from "./params.types";
import {
  Authentication,
  ResponseData,
  AuthenticatedRoute,
  FullRoute,
  OpenRoute,
  ValidatedRoute,
  ListRoute,
  AuthenticatedListRoute,
  PaginationConfig,
  PaginationParams,
  PaginatedResponse,
} from "./routes.types";
import { RestMethod } from "./routes.types";

export type ValidatorFunction<T> = (data: unknown) => T;
export type AuthenticationFunction<T extends Authentication> = (
  headers: Record<string, string>
) => Promise<T>;

/**
 * This is the most confusing part of the type system, but also key.
 * This type is used to force type inferenece when creating your endpoints.
 * This is the structure to provide `function overload`s. This is so you can have the same function
 * (in our case get,put,post,delete) but allow differnt configurations.
 *
 * These configurations need to be strongly typed force the developers into using the tools.
 *
 * Want to allow Auth? - Gotta pass in authenticator and the type system handles it
 *
 * Also, this is where the core of the Zod system is. We force the body to be a zod validated input.
 * Luckily, this is pretty easy to replace.
 * PART of me wanted to further abstract it such that you needed a translation function but
 * that seemed overengineerd
 *
 */

/**
 * Configuration type for POST/PUT/DELETE endpoints.
 * These methods require a request body, so they always need a validator.
 *
 * Four variants (with/without auth × with/without query):
 * 1. Validated only, no query: validator + handler(params, body)
 * 2. Validated only, with query: validator + queryValidator + handler(params, body)
 * 3. Full (auth + validated), no query: authenticator + validator + handler(params, auth, body)
 * 4. Full (auth + validated), with query: authenticator + validator + queryValidator + handler(params, auth, body)
 */

type Config<
  Auth extends Authentication | undefined = undefined,
  RequestBody extends unknown | undefined = undefined,
  Query extends unknown | undefined = undefined,
> = {
  _auth: Auth;
  _body: RequestBody;
  _query: Query;
  authenticator?: Auth extends Authentication ? AuthenticationFunction<Auth> : never;
  validator?: RequestBody extends unknown ? ValidatorFunction<RequestBody> : never;
  queryValidator?: Query extends unknown ? ValidatorFunction<Query> : never;
};

type DerivedHandler<Path extends string, C extends Config<any, any, any>> = {
  url: Params<Path>;
} & {
  query: C["_query"] extends unknown ? C["_query"] : never;
} & { auth: C["_auth"] extends Authentication ? C["_auth"] : never } & {
  body: C["_body"] extends unknown ? C["_body"] : never;
};

type DeriveRoute<
  Path extends string,
  Method extends RestMethod,
  C extends Config<any, any, any>,
> = C["_auth"] extends Authentication
  ? FullRoute<Path, Method, ResponseData, C["_body"], C["_auth"], C["_query"]>
  : C["_body"] extends unknown
    ? ValidatedRoute<Path, Method, ResponseData, C["_body"], C["_query"]>
    : C["_query"] extends unknown
      ? OpenRoute<Path, Method, ResponseData>
      : never;

export type EndpointCreationFunction<Path extends string, Method extends RestMethod> = {
  <Res extends ResponseData, C extends Config<any, any, any>>(
    config: C & {
      handler: (args: DerivedHandler<Path, C>) => Promise<Res>;
    }
  ): DeriveRoute<Path, Method, C>;
};

/**
 * Configuration type for GET/DELETE endpoints.
 * These methods cannot have a request body, so no validator.
 *
 * Four variants (with/without auth × with/without query):
 * 1. Open, no query: just handler(params)
 * 2. Open, with query: queryValidator + handler(params)
 * 3. Authenticated, no query: authenticator + handler(params, auth)
 * 4. Authenticated, with query: authenticator + queryValidator + handler(params, auth)
 */
export type GetEndpointCreationFunction<Path extends string, Method extends RestMethod> = {
  // Open route: no auth, with query (MUST be before no-query variant)
  <Res extends ResponseData, Query extends unknown>(config: {
    authenticator?: never;
    queryValidator: ValidatorFunction<Query>;
    handler: (params: { url: Params<Path>; query: Query }) => Promise<Res>;
  }): OpenRoute<Path, Method, Res, Query>;

  // Open route: no auth, no query
  <Res extends ResponseData>(config: {
    authenticator?: never;
    queryValidator?: never;
    handler: (params: { url: Params<Path> }) => Promise<Res>;
  }): OpenRoute<Path, Method, Res, undefined>;

  // Authenticated route: auth, with query (MUST be before no-query variant)
  <Res extends ResponseData, Auth extends Authentication, Query extends unknown>(config: {
    authenticator: AuthenticationFunction<Auth>;
    queryValidator: ValidatorFunction<Query>;
    handler: (params: { url: Params<Path>; query: Query }, auth: Auth) => Promise<Res>;
  }): AuthenticatedRoute<Path, Method, Res, Auth, Query>;

  // Authenticated route: auth, no query
  <Res extends ResponseData, Auth extends Authentication>(config: {
    authenticator: AuthenticationFunction<Auth>;
    queryValidator?: never;
    handler: (params: { url: Params<Path> }, auth: Auth) => Promise<Res>;
  }): AuthenticatedRoute<Path, Method, Res, Auth, undefined>;
};

/**
 * Configuration type for LIST endpoints (paginated GET).
 * Always returns PaginatedResponse<T>. Pagination params are automatically
 * parsed from query string by the framework.
 *
 * Four variants (with/without auth × with/without query filters):
 * 1. List, no auth, no query: handler(params) with pagination
 * 2. List, no auth, with query: queryValidator + handler(params) with pagination
 * 3. Authenticated list, no query: authenticator + handler(params, auth) with pagination
 * 4. Authenticated list, with query: authenticator + queryValidator + handler(params, auth) with pagination
 */
export type ListEndpointCreationFunction<Path extends string> = {
  // List route: no auth, with query filters (MUST be before no-query variant)
  <Data, Query extends unknown>(config: {
    authenticator?: never;
    queryValidator: ValidatorFunction<Query>;
    paginationConfig?: PaginationConfig;
    handler: (params: {
      url: Params<Path>;
      query: Query;
      pagination: PaginationParams;
    }) => Promise<PaginatedResponse<Data>>;
  }): ListRoute<Path, Data, Query>;

  // List route: no auth, no query filters
  <Data>(config: {
    authenticator?: never;
    queryValidator?: never;
    paginationConfig?: PaginationConfig;
    handler: (params: {
      url: Params<Path>;
      pagination: PaginationParams;
    }) => Promise<PaginatedResponse<Data>>;
  }): ListRoute<Path, Data, undefined>;

  // Authenticated list route: auth, with query filters (MUST be before no-query variant)
  <Data, Auth extends Authentication, Query extends unknown>(config: {
    authenticator: AuthenticationFunction<Auth>;
    queryValidator: ValidatorFunction<Query>;
    paginationConfig?: PaginationConfig;
    handler: (
      params: {
        url: Params<Path>;
        query: Query;
        pagination: PaginationParams;
      },
      auth: Auth
    ) => Promise<PaginatedResponse<Data>>;
  }): AuthenticatedListRoute<Path, Data, Auth, Query>;

  // Authenticated list route: auth, no query filters
  <Data, Auth extends Authentication>(config: {
    authenticator: AuthenticationFunction<Auth>;
    queryValidator?: never;
    paginationConfig?: PaginationConfig;
    handler: (
      params: {
        url: Params<Path>;
        pagination: PaginationParams;
      },
      auth: Auth
    ) => Promise<PaginatedResponse<Data>>;
  }): AuthenticatedListRoute<Path, Data, Auth, undefined>;
};
