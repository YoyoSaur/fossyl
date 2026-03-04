// Router creation
export { createRouter } from "./router/router";

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
  ApiResponse,
  OpenRoute,
  AuthenticatedRoute,
  ValidatedRoute,
  FullRoute,
  ListRoute,
  AuthenticatedListRoute,
  RestMethod,
  Route,
  // Pagination types
  PaginationParams,
  PaginationConfig,
  PaginatedResponse,
} from "./router/types/routes.types";

export type { ValidatorFunction, AuthenticationFunction } from "./router/types/configuration.types";

export type { Endpoint, Router } from "./router/types/router-creation.types";

export type { Params } from "./router/types/params.types";

// Validation types
export type { ValidationResult, ValidationError, ValidationWarning } from "./validation";

// Utility exports
export { authWrapper } from "./router/types/routes.types";

// Stream types
export type {
  StreamEvent,
  StreamOpenRoute,
  StreamAuthenticatedRoute,
} from "./router/types/stream.types";

export { streamEvent } from "./router/types/stream.types";

export type { StreamEndpointCreationFunction } from "./router/types/configuration.types";
