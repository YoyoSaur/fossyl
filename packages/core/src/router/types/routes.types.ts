import { AuthenticationFunction, ValidatorFunction } from "./router-creation.types";

declare const authBrand: unique symbol;
declare const requestBrand: unique symbol;
/**
 * Brand type for authenticated user data.
 *
 * All authentication data returned from authenticator functions must be branded
 * with this type to ensure proper type inference in route handlers.
 *
 * Used internally - you typically won't reference this type directly.
 * Use authWrapper() in your authenticator functions to apply the brand.
 *
 * Search for this type in your codebase to find all authentication implementations.
 */
export type Authentication = { readonly [authBrand]: "Auth" };

/**
 * Brand type for validated request bodies.
 *
 * All request bodies passed through validator functions should be branded
 * with this type to track which data has been validated.
 *
 * Used internally - you typically won't reference this type directly.
 * Use bodyWrapper() in your validator functions to apply the brand.
 *
 * Search for this type in your codebase to find all request body validators.
 */
export type RequestBody = { readonly [requestBrand]: "RequestBody" };

/**
 * Wraps authentication data with proper branding for type inference.
 *
 * Use this in your authenticator function's return value to ensure
 * the auth object is properly typed throughout the route handler.
 *
 * @example
 * const authenticator = async (headers: Record<string, string>) => {
 *   return authWrapper({
 *     userId: headers['x-user-id'],
 *     role: headers['x-user-role']
 *   });
 * };
 */
export function authWrapper<T>(auth: T): T & Authentication {
  return {
    ...auth,
    [authBrand]: "Auth",
  };
}

/**
 * Wraps request body data with proper branding for type inference.
 *
 * Use this in your validator function's return value to ensure
 * the body object is properly typed throughout the route handler.
 *
 * @example
 * const validator = (data: unknown): { name: string; email: string } & RequestBody => {
 *   // Your validation logic here (can use Zod, Yup, etc.)
 *   return bodyWrapper({
 *     name: String(data.name),
 *     email: String(data.email)
 *   });
 * };
 */
export function bodyWrapper<T>(body: T): T & RequestBody {
  return {
    ...body,
    [requestBrand]: "RequestBody",
  };
}

/**
 * Union of HTTP methods supported by fossyl routes.
 */
export type RestMethod = "GET" | "POST" | "PUT" | "DELETE";

/**
 * POST | PUT — methods that support a request body.
 * Only these can be used on ValidatedRouter and FullRouter.
 */
export type BodySupportedMethods = Extract<RestMethod, "POST" | "PUT">;

// ============================================================================
// Pagination Types
// ============================================================================

/**
 * Pagination parameters parsed from query string.
 * Always present on list route handlers.
 */
export type PaginationParams = {
  page: number;
  pageSize: number;
};

/**
 * Optional configuration for pagination behavior.
 */
export type PaginationConfig = {
  /** Default page size if not specified. Defaults to 20. */
  defaultPageSize: number;
  /** Maximum allowed page size. Defaults to 100. */
  maxPageSize: number;
};

/**
 * Required response shape for list routes.
 * - data: The items for this page
 * - pagination: Metadata about the current page
 *   - page, pageSize: Always required (echo back the request)
 *   - hasMore: Optional, use N+1 trick to compute cheaply
 *   - total: Optional, requires COUNT query (expensive)
 */
export type PaginatedResponse<T extends ResponseData> = {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    hasMore?: boolean;
    total?: number;
  };
};

/**
 * Base constraint for all response types.
 *
 * All data returned from route handlers must include a `typeName` property
 * that identifies the response type. This enables:
 * - Self-describing API responses
 * - Easy ESLint enforcement
 * - Type extraction for ApiResponse wrapper
 *
 * @example
 * type User = {
 *   typeName: 'User';
 *   id: string;
 *   name: string;
 * };
 */
export type ResponseData<TypeName extends string = string> = {
  typeName: TypeName;
};

/**
 * Ordered execution steps for the curry chain.
 *
 * "params"  — assembles { url, query, pagination } from the request.
 * "headers" — runs the authenticator against request headers.
 * "body"    — runs the validator against the request body.
 */
export type Steps = "params" | "headers" | "body";

/**
 * A fully-configured fossyl route, produced by the builder chain.
 *
 * Adapters receive Route[] and pass each route to executeRoute().
 *
 * @property path - The URL path (e.g. "/api/users/:id")
 * @property method - HTTP method
 * @property steps - Which curry layers exist. executeRoute iterates these in order.
 * @property handler - The curried handler function.
 * @property authenticator - Authenticator function (present when steps includes "headers")
 * @property validator - Validator function (present when steps includes "body")
 * @property queryValidator - Optional query parameter validator
 * @property urlParamValidator - Optional URL parameter converter
 * @property paginationConfig - Optional pagination configuration
 * @property hasTransaction - Whether database adapter should wrap in a transaction
 */
export type Route = {
  path: string;
  method: RestMethod;
  steps: Steps[];
  handler: Function;
  authenticator?: AuthenticationFunction<any>;
  validator?: ValidatorFunction<any>;
  queryValidator?: ValidatorFunction<any>;
  urlParamValidator?: ValidatorFunction<any>;
  paginationConfig?: PaginationConfig;
  hasTransaction: boolean;
};

/**
 * Interface adapter authors implement to bridge framework requests into fossyl.
 *
 * Each method extracts a specific slice of data from the framework's request object.
 * executeRoute calls these internally when iterating over route.steps.
 *
 * @typeParam TReq - The framework's request type (e.g. Express Request)
 *
 * @example (Express):
 * ```typescript
 * const extractor: RequestExtractor<Request> = {
 *   params: (req) => ({ url: req.params, query: req.query }),
 *   headers: (req) => req.headers as Record<string, string>,
 *   body: (req) => req.body,
 * };
 * ```
 */
export type RequestExtractor<TReq> = {
  params: (req: TReq) => { url: Record<string, string>; query: Record<string, string> };
  headers: (req: TReq) => Record<string, string>;
  body: (req: TReq) => unknown;
};
