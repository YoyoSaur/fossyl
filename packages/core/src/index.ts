// Router creation
export { createRouter, executeRoute } from "./router/router";

// Config
export { defineConfig } from "./config";
export type { FossylConfig, AdaptersConfig } from "./config";

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

export type { Params } from "./router/types/params.types";

// Validation types
export type { ValidationResult, ValidationError, ValidationWarning } from "./validation";

// Utility exports
export { authWrapper } from "./router/types/routes.types";
