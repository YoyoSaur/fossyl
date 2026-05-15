import {
  GetEndpointCreationFunction,
  EndpointCreationFunction,
  ListEndpointCreationFunction,
  AuthenticationFunction,
} from "./configuration.types";
import { Params } from "./params.types";
import { AuthenticatedRoute, Authentication, ResponseData, ValidatedRoute } from "./routes.types";

/* Endpoint seems more complex than it is from its type signature.
 * It has 5 Major functions on offer. The different HTTP methods + list
 *
 * These use the EndpointCreationFunction
 */
export type Endpoint<Path extends string> = {
  get: GetEndpointCreationFunction<Path, "GET">;
  post: EndpointCreationFunction<Path, "POST">;
  put: EndpointCreationFunction<Path, "PUT">;
  delete: GetEndpointCreationFunction<Path, "DELETE">;
  /**
   * Create a paginated list endpoint (GET).
   * Pagination params (page, pageSize) are automatically parsed from query string.
   * Handler must return PaginatedResponse<T>.
   */
  list: ListEndpointCreationFunction<Path>;
};

export type OpenHandler<Path extends string, Response extends unknown> = (params: {
  url: Params<Path>;
}) => Promise<Response>;

export type ValidatedHandler<
  Path extends string,
  Response extends unknown,
  RequestBody extends unknown,
> = (params: { url: Params<Path> }, body: RequestBody) => Promise<Response>;

export type AuthenticatedHandler<
  Path extends string,
  Response extends unknown,
  Auth extends Authentication,
> = (params: { url: Params<Path> }, auth: Auth) => Promise<Response>;

export type FullHandler<
  Path extends string,
  Response extends unknown,
  RequestBody extends unknown,
  Auth extends Authentication,
> = (params: { url: Params<Path> }, auth: Auth, body: RequestBody) => Promise<Response>;

export type AuthenticatedRouter<Path extends string, Auth extends Authentication> = {
  get: <Response extends ResponseData>(
    handler: AuthenticatedHandler<Path, Response, Auth>
  ) => AuthenticatedRoute<Path, "GET", Response, Auth>;
};

export type ValidatedRouter<Path extends string, RequestBody extends unknown> = {
  get: <Response extends ResponseData>(
    handler: ValidatedHandler<Path, Response, RequestBody>
  ) => ValidatedRoute<Path, "GET", Response, RequestBody>;
};

export type FullRouter<
  Path extends string,
  RequestBody extends unknown,
  Auth extends Authentication,
> = {};

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
  authenticator: <Auth extends Authentication>(
    authenticationFunction: AuthenticationFunction<Auth>
  ) => AuthenticatedRouter<BasePath, Auth>;
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
