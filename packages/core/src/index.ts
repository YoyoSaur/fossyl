// Router creation
export { createRouter, executeRoute } from "./router/router";

// Config
export type { AdaptersConfig } from "./config";

// Adapter types
export type {
  FrameworkAdapter,
  DatabaseAdapter,
  DatabaseContext,
  ValidationAdapter,
  LoggerAdapter,
  Logger,
  HttpMethod,
} from "./adapters";

// Route types
export type {
  Authentication,
  ResponseData,
  RestMethod,
  Route,
  RequestExtractor,
  // Pagination types
  PaginationParams,
  PaginationConfig,
  PaginatedResponse,
} from "./router/types/routes.types";

export type {
  Endpoint,
  Router,
  ValidatorFunction,
  AuthenticationFunction,
} from "./router/types/router-creation.types";

export type { FossylError } from "./router/errors";

export {
  fossylBadRequest,
  fossylUnauthorized,
  fossylForbidden,
  fossylNotFound,
  fossylConflict,
  fossylValidationError,
  fossylInternal,
  isFossylError,
} from "./router/errors";

export type { Params } from "./router/types/params.types";

// Utility exports
export { authWrapper } from "./router/types/routes.types";
