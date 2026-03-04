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
import { StreamOpenRoute, StreamAuthenticatedRoute, StreamEvent } from "./stream.types";

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
 * Four variants (with/without auth x with/without query):
 * 1. Validated only, no query: validator + handler(params, body)
 * 2. Validated only, with query: validator + queryValidator + handler(params, body)
 * 3. Full (auth + validated), no query: authenticator + validator + handler(params, auth, body)
 * 4. Full (auth + validated), with query: authenticator + validator + queryValidator + handler(params, auth, body)
 */
export type EndpointCreationFunction<Path extends string, Method extends RestMethod> = {
  // Validated route: no auth, with query (MUST be before no-query variant)
  <Res extends ResponseData, RequestBody extends unknown, Query extends unknown>(config: {
    authenticator?: never;
    validator: ValidatorFunction<RequestBody>;
    queryValidator: ValidatorFunction<Query>;
    handler: (params: { url: Params<Path>; query: Query }, body: RequestBody) => Promise<Res>;
  }): ValidatedRoute<Path, Method, Res, RequestBody, Query>;

  // Validated route: no auth, no query
  <Res extends ResponseData, RequestBody extends unknown>(config: {
    authenticator?: never;
    validator: ValidatorFunction<RequestBody>;
    queryValidator?: never;
    handler: (params: { url: Params<Path> }, body: RequestBody) => Promise<Res>;
  }): ValidatedRoute<Path, Method, Res, RequestBody, undefined>;

  // Full route: auth + body validation, with query (MUST be before no-query variant)
  <
    Res extends ResponseData,
    RequestBody extends unknown,
    Auth extends Authentication,
    Query extends unknown,
  >(config: {
    authenticator: AuthenticationFunction<Auth>;
    validator: ValidatorFunction<RequestBody>;
    queryValidator: ValidatorFunction<Query>;
    handler: (
      params: { url: Params<Path>; query: Query },
      auth: Auth,
      body: RequestBody
    ) => Promise<Res>;
  }): FullRoute<Path, Method, Res, RequestBody, Auth, Query>;

  // Full route: auth + body validation, no query
  <Res extends ResponseData, RequestBody extends unknown, Auth extends Authentication>(config: {
    authenticator: AuthenticationFunction<Auth>;
    validator: ValidatorFunction<RequestBody>;
    queryValidator?: never;
    handler: (params: { url: Params<Path> }, auth: Auth, body: RequestBody) => Promise<Res>;
  }): FullRoute<Path, Method, Res, RequestBody, Auth, undefined>;
};

/**
 * Configuration type for GET/DELETE endpoints.
 * These methods cannot have a request body, so no validator.
 *
 * Four variants (with/without auth x with/without query):
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
 * Four variants (with/without auth x with/without query filters):
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

/**
 * Configuration type for stream endpoints.
 * SSE is GET-only - no body validation. Two variants: open (public) and authenticated.
 *
 * Four variants (with/without auth x with/without query):
 * 1. Open stream, no query: handler(params: {url, signal}) -> AsyncIterable<Events>
 * 2. Open stream, with query: queryValidator + handler(params: {url, query, signal}) -> AsyncIterable<Events>
 * 3. Authenticated stream, no query: authenticator + handler(params: {url, signal}, auth) -> AsyncIterable<Events>
 * 4. Authenticated stream, with query: authenticator + queryValidator + handler(params: {url, query, signal}, auth) -> AsyncIterable<Events>
 */
export type StreamEndpointCreationFunction<Path extends string> = {
  // Stream-open: no auth, no query
  <Events extends StreamEvent>(config: {
    authenticator?: never;
    queryValidator?: never;
    handler: (params: { url: Params<Path>; signal: AbortSignal }) => AsyncIterable<Events>;
  }): StreamOpenRoute<Path, Events, undefined>;

  // Stream-open: no auth, with query
  <Events extends StreamEvent, Query extends unknown>(config: {
    authenticator?: never;
    queryValidator: ValidatorFunction<Query>;
    handler: (params: {
      url: Params<Path>;
      query: Query;
      signal: AbortSignal;
    }) => AsyncIterable<Events>;
  }): StreamOpenRoute<Path, Events, Query>;

  // Stream-authenticated: auth, no query
  <Events extends StreamEvent, Auth extends Authentication>(config: {
    authenticator: AuthenticationFunction<Auth>;
    queryValidator?: never;
    handler: (
      params: { url: Params<Path>; signal: AbortSignal },
      auth: Auth
    ) => AsyncIterable<Events>;
  }): StreamAuthenticatedRoute<Path, Events, Auth, undefined>;

  // Stream-authenticated: auth, with query
  <Events extends StreamEvent, Auth extends Authentication, Query extends unknown>(config: {
    authenticator: AuthenticationFunction<Auth>;
    queryValidator: ValidatorFunction<Query>;
    handler: (
      params: { url: Params<Path>; query: Query; signal: AbortSignal },
      auth: Auth
    ) => AsyncIterable<Events>;
  }): StreamAuthenticatedRoute<Path, Events, Auth, Query>;
};
