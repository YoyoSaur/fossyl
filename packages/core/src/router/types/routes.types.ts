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

export type RestMethod = "GET" | "POST" | "PUT" | "DELETE";
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

export type Steps = "params" | "headers" | "body";

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

export type RequestExtractor<TReq> = {
  params: (req: TReq) => { url: Record<string, string>; query: Record<string, string> };
  headers: (req: TReq) => Record<string, string>;
  body: (req: TReq) => unknown;
};
