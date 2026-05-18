import { AuthenticationFunction, ValidatorFunction } from "./configuration.types";
import { EndpointParams } from "./params.types";
import {
  AuthenticatedRoute,
  Authentication,
  FullRoute,
  OpenRoute,
  PaginationConfig,
  PaginationParams,
  ResponseData,
  RestMethod,
  ValidatedRoute,
} from "./routes.types";

export type Handler<
  P extends EndpointParams<string, unknown | undefined, PaginationParams | undefined>,
  Response extends ResponseData,
  RequestBody extends unknown | undefined,
  Auth extends Authentication | undefined,
> = UrlChain<[P["url"], P["query"], P["pagination"], Auth, RequestBody], Response>;

type UrlParamsToken<T> = T & { readonly __kind: "url" };
type QueryToken<T> = T & { readonly __kind: "query" };
type PaginationToken<T> = T & { readonly __kind: "pagination" };
type AuthToken<T> = T & { readonly __kind: "auth" };
type BodyToken<T> = T & { readonly __kind: "body" };

type UrlChain<Stack extends [any, any, any, any, any], Response> = Stack extends [
  infer url,
  ...infer Rest extends [any, any, any, any],
]
  ? undefined extends url
    ? QueryChain<Rest, Response>
    : (url: UrlParamsToken<url>) => QueryChain<Rest, Response>
  : never;

type QueryChain<Stack extends [any, any, any, any], Response> = Stack extends [
  infer query,
  ...infer Rest extends [any, any, any],
]
  ? undefined extends query
    ? PaginationChain<Rest, Response>
    : (query: QueryToken<query>) => PaginationChain<Rest, Response>
  : never;

type PaginationChain<Stack extends [any, any, any], Response> = Stack extends [
  infer pagination,
  ...infer Rest extends [any, any],
]
  ? undefined extends pagination
    ? AuthenticationChain<Rest, Response>
    : (pagination: PaginationToken<pagination>) => AuthenticationChain<Rest, Response>
  : never;

type AuthenticationChain<Stack extends [any, any], Response> = Stack extends [
  infer auth,
  ...infer Rest extends [any],
]
  ? undefined extends auth
    ? BodyChain<Rest, Response>
    : (auth: AuthToken<auth>) => BodyChain<Rest, Response>
  : never;

type BodyChain<Stack extends [any], Response> = Stack extends [infer body]
  ? undefined extends body
    ? () => Promise<Response>
    : (body: BodyToken<body>) => () => Promise<Response>
  : never;

export type OpenRouter<
  P extends EndpointParams<string, unknown | undefined, PaginationParams | undefined>,
> = {
  validator: <RequestBody extends unknown>(
    validatorFunction: ValidatorFunction<RequestBody>
  ) => ValidatedRouter<P, RequestBody>;
  authenticator: <Auth extends Authentication>(
    authenticationFunction: AuthenticationFunction<Auth>
  ) => AuthenticatedRouter<P, Auth>;
} & {
  [Method in RestMethod as Lowercase<Method>]: <Response extends ResponseData>(
    handler: Handler<P, Response, undefined, undefined>
  ) => OpenRoute<P["path"], Method, Response>;
};

export type PaginatedRouter<
  P extends EndpointParams<string, unknown | undefined, PaginationParams>,
> = OpenRouter<P>;

export type QueryableRouter<P extends EndpointParams<string, unknown>> = {
  paginate: (
    paginationConfig: PaginationConfig
  ) => PaginatedRouter<EndpointParams<P["path"], P["query"], PaginationParams>>;
} & OpenRouter<P>;

export type AuthenticatedRouter<
  P extends EndpointParams<string, unknown | undefined, PaginationParams | undefined>,
  Auth extends Authentication,
> = {
  validator: <RequestBody extends unknown>(
    validatorFunction: ValidatorFunction<RequestBody>
  ) => FullRouter<P, RequestBody, Auth>;
} & {
  [Method in RestMethod as Lowercase<Method>]: <Response extends ResponseData>(
    handler: Handler<P, Response, undefined, Auth>
  ) => AuthenticatedRoute<P["path"], Method, Response, Auth>;
};

export type ValidatedRouter<
  P extends EndpointParams<string, unknown | undefined, PaginationParams | undefined>,
  RequestBody extends unknown,
> = {
  [Method in RestMethod as Lowercase<Method>]: <Response extends ResponseData>(
    handler: Handler<P, Response, RequestBody, undefined>
  ) => ValidatedRoute<P["path"], Method, Response, RequestBody>;
};

export type FullRouter<
  P extends EndpointParams<string, unknown | undefined, PaginationParams | undefined>,
  RequestBody extends unknown,
  Auth extends Authentication,
> = {
  [Method in RestMethod as Lowercase<Method>]: <Response extends ResponseData>(
    handler: Handler<P, Response, RequestBody, Auth>
  ) => FullRoute<P["path"], Method, Response, RequestBody, Auth>;
};

/* Endpoint seems more complex than it is from its type signature.
 * It has 5 Major functions on offer. The different HTTP methods + list
 *
 * These use the EndpointCreationFunction
 */
export type Endpoint<Path extends string> = {
  query: <Query>(
    queryValidator: ValidatorFunction<Query>
  ) => QueryableRouter<EndpointParams<Path, Query>>;
  paginate: (
    paginationConfig: PaginationConfig
  ) => PaginatedRouter<EndpointParams<Path, undefined, PaginationParams>>;
} & OpenRouter<EndpointParams<Path>>;

/**
 * Creates a router that ensures all endpoints extend the route.
 * IDK if this is actually useful, but I kinda like it.
 *
 * There def was a part of me that thought about pure generator functions.
 * In fact... they're provided!
 *
 * We can discuss that.
 */
export type Router<BasePath extends string> = {
  /**
   * Creates an endpoint
   * @param path string, must extend Router's string
   */
  createEndpoint: <Path extends `${BasePath}${string}`>(path: Path) => Endpoint<Path>;
  /**
   * Creates a subrouter
   * @param path string, must extend Router's string
   */
  createSubrouter: <Path extends `${BasePath}${string}`>(path: Path) => Router<Path>;
};
