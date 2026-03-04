import {
  GetEndpointCreationFunction,
  EndpointCreationFunction,
  ListEndpointCreationFunction,
  StreamEndpointCreationFunction,
} from "./configuration.types";

/* Endpoint seems more complex than it is from its type signature.
 * It has 6 Major functions on offer. The different HTTP methods + list + stream
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
  stream: StreamEndpointCreationFunction<Path>;
};

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
