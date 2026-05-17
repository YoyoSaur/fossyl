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
import { Expand } from "./util.types";

export type OpenHandler<
  P extends EndpointParams<string, unknown | undefined, PaginationParams | undefined>,
  Response extends ResponseData,
> = undefined extends P["url"]
  ? () => Promise<Response>
  : (url: P["url"]) => () => Promise<Response>;

export type PaginatedHandler<
  P extends EndpointParams<string, unknown | undefined, PaginationParams>,
  Response extends ResponseData,
> = (
  pagination: Expand<PaginationParams>
) => OpenHandler<EndpointParams<P["path"], P["query"], PaginationParams>, Response>;

export type QueryableHandler<
  P extends EndpointParams<string, unknown, PaginationParams | undefined>,
  Response extends ResponseData,
> = (
  query: P["query"]
) => undefined extends P["pagination"]
  ? OpenHandler<P, Response>
  : PaginatedHandler<EndpointParams<P["path"], P["query"], PaginationParams>, Response>;

type InnerHandler<
  P extends EndpointParams<string, unknown | undefined, PaginationParams | undefined>,
  Response extends ResponseData,
> = undefined extends P["query"]
  ? undefined extends P["pagination"]
    ? OpenHandler<EndpointParams<P["path"], P["query"], PaginationParams>, Response>
    : PaginatedHandler<EndpointParams<P["path"], P["query"], PaginationParams>, Response>
  : QueryableHandler<EndpointParams<P["path"], P["query"], PaginationParams>, Response>;

export type ValidatedHandler<
  P extends EndpointParams<string, unknown | undefined, PaginationParams | undefined>,
  Response extends ResponseData,
  RequestBody extends unknown,
> = (body: RequestBody) => InnerHandler<P, Response>;

export type AuthenticatedHandler<
  P extends EndpointParams<string, unknown | undefined, PaginationParams | undefined>,
  Response extends ResponseData,
  Auth extends Authentication,
> = (auth: Auth) => InnerHandler<P, Response>;

export type FullHandler<
  P extends EndpointParams<string, unknown | undefined, PaginationParams | undefined>,
  Response extends ResponseData,
  RequestBody extends unknown,
  Auth extends Authentication,
> = (auth: Auth) => (body: RequestBody) => InnerHandler<P, Response>;

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
    handler: OpenHandler<P, Response>
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
    handler: AuthenticatedHandler<P, Response, Auth>
  ) => AuthenticatedRoute<P["path"], Method, Response, Auth>;
};

export type ValidatedRouter<
  P extends EndpointParams<string, unknown | undefined, PaginationParams | undefined>,
  RequestBody extends unknown,
> = {
  [Method in RestMethod as Lowercase<Method>]: <Response extends ResponseData>(
    handler: ValidatedHandler<P, Response, RequestBody>
  ) => ValidatedRoute<P["path"], Method, Response, RequestBody>;
};

export type FullRouter<
  P extends EndpointParams<string, unknown | undefined, PaginationParams | undefined>,
  RequestBody extends unknown,
  Auth extends Authentication,
> = {
  [Method in RestMethod as Lowercase<Method>]: <Response extends ResponseData>(
    handler: FullHandler<P, Response, RequestBody, Auth>
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
