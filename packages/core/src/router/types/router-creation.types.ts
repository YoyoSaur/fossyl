import { EndpointParams } from "./params.types";
import {
  Authentication,
  BodySupportedMethods,
  PaginatedResponse,
  PaginationConfig,
  PaginationParams,
  ResponseData,
  RestMethod,
  Route,
} from "./routes.types";
import { StripUndefined } from "./util.types";

// ---Validator Functions

export type ValidatorFunction<T> = (data: unknown) => T;
export type AuthenticationFunction<T extends Authentication> = (
  headers: Record<string, string>
) => Promise<T>;

// ---Handler Parameters Construction
type HandlerParams<
  P extends Pick<
    EndpointParams<string, unknown | undefined, PaginationParams | undefined>,
    "url" | "query" | "pagination"
  >,
> =
  StripUndefined<{
    url: UrlParamsToken<P["url"]>;
    query: QueryToken<P["query"]>;
    pagination: PaginationToken<P["pagination"]>;
  }> extends infer T
    ? {} extends T
      ? never
      : T
    : never;

type ParametersToken<T> = T & { readonly __kind: "parameters" };
type UrlParamsToken<T> = T & { readonly __kind: "url" };
type QueryToken<T> = T & { readonly __kind: "query" };
type PaginationToken<T> = T & { readonly __kind: "pagination" };
type AuthToken<T> = T & { readonly __kind: "auth" };
type BodyToken<T> = T & { readonly __kind: "body" };

export type Handler<
  P extends EndpointParams<string, unknown | undefined, PaginationParams | undefined>,
  Response extends ResponseData,
  RequestBody extends unknown | undefined,
  Auth extends Authentication | undefined,
> = UrlChain<
  [P, Auth, RequestBody],
  undefined extends P["pagination"] ? Response : PaginatedResponse<Response>
>;

// ----Currying Chain

type UrlChain<
  Stack extends [
    EndpointParams<string, unknown | undefined, PaginationParams | undefined>,
    any,
    any,
  ],
  Response,
> =
  HandlerParams<Stack[0]> extends never
    ? AuthenticationChain<[Stack[1], Stack[2]], Response>
    : (
        parameters: ParametersToken<HandlerParams<Stack[0]>>
      ) => AuthenticationChain<[Stack[1], Stack[2]], Response>;

type AuthenticationChain<Stack extends [any, any], Response> = undefined extends Stack[0]
  ? BodyChain<[Stack[1]], Response>
  : (auth: AuthToken<Stack[0]>) => BodyChain<[Stack[1]], Response>;

type BodyChain<Stack extends [any], Response> = undefined extends Stack[0]
  ? () => Promise<Response>
  : (body: BodyToken<Stack[0]>) => () => Promise<Response>;

// ----Route Builder

export type QueryableRouter<P extends EndpointParams<string, unknown>> = {
  paginate: (
    paginationConfig: PaginationConfig
  ) => PaginatedRouter<EndpointParams<P["path"], P["query"], PaginationParams>>;
} & OpenRouter<P>;

export type PaginatedRouter<
  P extends EndpointParams<string, unknown | undefined, PaginationParams>,
> = OpenRouter<P>;

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
  ) => Route;
};
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
  ) => Route;
};

export type ValidatedRouter<
  P extends EndpointParams<string, unknown | undefined, PaginationParams | undefined>,
  RequestBody extends unknown,
> = {
  [Method in BodySupportedMethods as Lowercase<Method>]: <Response extends ResponseData>(
    handler: Handler<P, Response, RequestBody, undefined>
  ) => Route;
};

export type FullRouter<
  P extends EndpointParams<string, unknown | undefined, PaginationParams | undefined>,
  RequestBody extends unknown,
  Auth extends Authentication,
> = {
  [Method in BodySupportedMethods as Lowercase<Method>]: <Response extends ResponseData>(
    handler: Handler<P, Response, RequestBody, Auth>
  ) => Route;
};

// ----Entrypoints

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
