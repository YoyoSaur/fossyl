# Fossyl Agent Reference

## API Reference

### @fossyl/core

#### createRouter

Use when grouping related endpoints under a shared path namespace. Creates the scope for createEndpoint chains.


Creates a type-level namespace constraint. The `BasePath` generic
enforces at compile-time that all createEndpoint() paths in this
router start with the given string. Does NOT concatenate or
prepend at runtime — endpoints use full paths.

No middleware goes on the router. All middleware
(.authenticator(), .validator(), .query(), .paginate()) is
declared on individual createEndpoint() chains.


#### createEndpoint

Use when defining a single API endpoint. Starts the builder chain that configures middleware and terminates with an HTTP method.


Starts a full builder chain for one endpoint. The chain order
is enforced by the type system:

createEndpoint(path) → .query() → .paginate() → .authenticator()
→ .validator() → .get() / .post() / .put() / .delete()

All steps are optional. The chain MUST terminate with a method
call — the expression is void after the terminal.


#### executeRoute

Use internally within framework adapters to resolve the handler curry chain at request time. Not called directly by user code.


Internal runtime resolver. Steps through the middleware chain,
calling each layer synchronously in order (params → auth → body),
then executing the final async handler. The framework adapter
(e.g., expressAdapter) calls this — user code never does.


#### fossylError

Use when constructing a FossylError from a raw HTTP status code and message. Prefer the named helpers below instead.


Low-level factory: fossylError(404, "Not found", details?).
Creates a FossylError branded with the given status code.
Prefer the named helpers (fossylNotFound, fossylBadRequest,
etc.) for readability.


#### fossylBadRequest

Use when returning HTTP 400 errors for semantic validation failures in business logic.


HTTP 400 Bad Request. Use for semantic validation failures
(e.g., "email already in use"). Not for parse errors — those
are caught by zodValidator and automatically return 422.


#### fossylUnauthorized

Use when authentication is missing or invalid (HTTP 401).


HTTP 401 Unauthorized. Use in authenticators when the request
lacks valid credentials. Not for permission failures (use
fossylForbidden for 403).


#### fossylForbidden

Use when the caller is authenticated but lacks permission (HTTP 403).


HTTP 403 Forbidden. Use in service layer when the caller
is authenticated but doesn't have permission for the
requested operation.


#### fossylNotFound

Use when a requested resource does not exist (HTTP 404).


HTTP 404 Not Found. Use in services/repos when a lookup
by ID or filter returns no results.


#### fossylConflict

Use when a resource state conflict prevents the operation (HTTP 409).


HTTP 409 Conflict. Use for duplicate resource creation,
version conflicts, or state mismatches.


#### fossylValidationError

Use when a request body or query fails validation (HTTP 422).


HTTP 422 Validation Error. Used automatically by zodValidator
and zodQueryValidator. Also use in manual validation logic.


#### fossylInternal

Use as a last resort for unexpected server-side failures (HTTP 500).


HTTP 500 Internal Server Error. Use sparingly — prefer specific
error codes. Typically wraps unexpected exceptions caught at
the service boundary.


#### isFossylError

Use at runtime to check whether a thrown value is a FossylError branded error.


Type guard that checks for the __fossyl brand property at
runtime. Returns true for any FossylError regardless of
status code.


#### FrameworkAdapter

Implement this interface to create an HTTP framework adapter (e.g., Express, Fastify).


Interface for HTTP framework adapters. Requires a `register`
method that receives Route objects and binds them to the
framework router. Also defines naming and any startup
lifecycle hooks.


#### DatabaseAdapter

Implement this interface to create a database adapter (e.g., Kysely, Prisma).


Interface for database adapters. Requires withTransaction
and withClient methods that wrap handler execution in a
database context. The adapter manages connection lifecycle
and transaction propagation via AsyncLocalStorage.


#### DatabaseContext

Type representing the database client/transaction context available at runtime.


Type for the database context object that adapters store
in AsyncLocalStorage. Contains the database client instance
and any transaction state.


#### ValidationAdapter

Implement this interface to create a validation adapter (e.g., Zod, Yup).


Interface for validation adapters. Defines a validate
method that takes raw input and returns validated/parsed
output or throws.


#### LoggerAdapter

Implement this interface to integrate a logging framework.


Interface for logger adapters. Defines the log method
signature expected by the framework.


#### Logger

Type representing a logger instance within the framework.


Logger interface with info, warn, error, debug methods.
Available per-request via getLogger() in the express adapter.


#### Route

Internal route definition — stores path, method, middleware config, and the handler function.


The Route type represents a fully-configured endpoint after
the builder chain completes. Contains path, method, middleware
steps, pagination config, transaction flag, and the compiled
handler. Created by terminal methods (.get/.post/.put/.delete).


#### Endpoint

The builder chain type returned by createEndpoint(). Carries the path as a generic for type-safe chaining.


The Endpoint type represents the state of a builder chain
before the terminal method is called. The generic parameter
carries the path string for compile-time constraint checking.


#### Router

The router type returned by createRouter(). Carries the base path as a generic to constrain createEndpoint paths.


The Router type carries the base path as a generic to enforce
that all createEndpoint() and createSubrouter() paths extend
this prefix. No middleware is stored at the router level.


#### RestMethod

Union of REST HTTP methods: GET | POST | PUT | DELETE.


String literal union type: "GET" | "POST" | "PUT" | "DELETE".
Used in Route definitions.


#### HttpMethod

Union of all HTTP methods including non-REST ones.


Broader union than RestMethod — includes PATCH, HEAD, OPTIONS
in addition to GET, POST, PUT, DELETE.


#### ValidatorFunction

Signature type for validator and query-validator functions.


Type: (data: unknown) => T. Implemented by zodValidator,
zodQueryValidator, or custom validators.


#### AuthenticationFunction

Signature type for authenticator functions passed to .authenticator().


Accepts raw auth data (e.g., headers), validates/parses it,
and returns an Authentication object or throws fossylUnauthorized.


#### Authentication

The result type returned by an authenticator function.


Generic type representing authenticated caller info. Typically
contains userId, roles, orgId, etc. Available at runtime via
params.auth in the handler curry.


#### ResponseData

Constraint type for handler return values.


Base type for all endpoint handler return values. Every handler
must return an object matching this shape. Framework adapters
wrap it into the standard response format.


#### RequestExtractor

Adapter interface for extracting params, headers, and body from framework-specific request objects.


Framework adapters implement this to teach the framework
how to extract URL params, query strings, headers, and
request bodies from incoming requests.


#### Params

The shape of the params argument in handler curries. Contains .url, .query, .pagination, and .auth depending on which middleware steps are present.


Generic params type available in handler curries when any
middleware is present. Properties depend on the chain:
  params.url         — path params (from :param segments)
  params.query       — parsed query params (from .query())
  params.pagination  — pagination info (from .paginate())
  params.auth        — authenticator result (from .authenticator())


#### PaginationParams

Pagination parameters available when .paginate() is chained on an endpoint.


Shape: { page: number; pageSize: number }. Automatically
parsed from query params when .paginate() is configured.
Available at params.pagination.


#### PaginationConfig

Configuration passed to .paginate() to control page size limits and defaults.


Shape: { defaultPageSize: number; maxPageSize?: number }.
Passed to the .paginate() chain step. The framework
clamps pageSize to maxPageSize at runtime.


#### PaginatedResponse

Return type wrapper for paginated endpoints.


Generic type: { data: T[]; pagination: { page, pageSize, hasMore } }.
Return this from handlers that use .paginate().


#### authWrapper

Use to brand an auth type for type-safe inference in handler curry chains.


Brands an Authentication type so the builder chain can
infer the auth parameter shape in the handler curry.
Used when declaring authenticator functions.


## Patterns

### handler-curry

Use when writing route handler functions. Determines the correct curry signature based on which middleware steps are present in the endpoint chain.


Handler functions use a curried pattern:

(params?) => (auth?) => (body?) => async () => Promise<Response>

Each layer is present or skipped based on which middleware
steps are in the chain. The type system infers the correct
signature — the table below shows every combination:

| Chain layers         | Handler signature                                     |
|----------------------|-------------------------------------------------------|
| none                 | async () => ({...})                                   |
| params only          | (params) => async () => ({...})                       |
| auth only            | (auth) => async () => ({...})                         |
| params + auth        | (params) => (auth) => async () => ({...})             |
| body only            | (body) => async () => ({...})                         |
| params + body        | (params) => (body) => async () => ({...})             |
| auth + body          | (auth) => (body) => async () => ({...})               |
| params + auth + body | (params) => (auth) => (body) => async () => ({...})   |

Rules:
- Only the final () => Promise<Response> is async.
- params is present when the path has :param, or .query()
  is chained, or .paginate() is chained.
- No .authenticator() = no auth layer.
- No .validator() = no body layer.


### builder-chain-order

Use when constructing an endpoint with createEndpoint(). Determines the correct order of chain steps.


The builder chain follows a fixed order enforced by the
type system:

createEndpoint(path)
  → .query(queryValidator)
  → .paginate(config)
  → .authenticator(authFn)
  → .validator(bodyFn)
  → .get() / .post() / .put() / .delete()

All steps are optional. The type system prevents calling
steps out of order. The chain MUST terminate with a method
call — the expression type is void after.


### params-shape

Use to understand what properties are available on the params argument in a handler curry. Depends on which middleware steps are configured.


The params object shape depends on the endpoint chain:

params.url         — Present when path has :param segments.
                     Contains path parameter values keyed by
                     name (e.g., { id: string }).

params.query       — Present when .query() is chained.
                     Contains parsed and validated query
                     string parameters.

params.pagination  — Present when .paginate() is chained.
                     Shape: { page: number, pageSize: number }.

params.auth        — Present when .authenticator() is chained.
                     Contains the return value of the
                     authenticator function (the Authentication
                     type).

Use _params as the parameter name when only auth or body
layers are present, to signal that params is unused. The
parameter name is a convention, not enforced by the type
system.


### error-conventions

Use when throwing or handling errors in services, repos, and route handlers. Defines which layer is responsible for what.


Error handling conventions by layer:

Routes (.route.ts):
- Never catch errors — let them propagate to the adapter
- All throws must be FossylError branded
- Handlers throw fossyl* errors from service calls

Services (.service.ts):
- Catch non-Fossyl errors and wrap with fossyl* functions
- All throws must be FossylError branded
- Don't catch FossylErrors — let them propagate

Repos (.repo.ts):
- Never throw — let Kysely adapter handle DB errors
- If throw is unavoidable, must be FossylError branded
- Return null/undefined for "not found" cases

All exported error creators:
- fossylError(status, message, details?) — generic factory
- fossylBadRequest(message?, details?) — 400
- fossylUnauthorized(message?, details?) — 401
- fossylForbidden(message?, details?) — 403
- fossylNotFound(message?, details?) — 404
- fossylConflict(message?, details?) — 409
- fossylValidationError(message?, details?) — 422
- fossylInternal(message?, details?) — 500


### architecture-boundaries

Use when organizing code into route, service, and repo layers. Defines the responsibilities and import rules for each layer.


Three-layer architecture enforced by linter rules:

*.route.ts — Endpoint definitions
- createRouter() + createEndpoint() chains
- No business logic — delegate to services
- Import services, not repos

*.service.ts — Business logic
- Multi-repo composition
- Import repos, not db directly
- Use fossyl* errors for business rule violations
- Import other services for service-of-services patterns

*.repo.ts — Data access
- Import db (kysely), not services
- Never throw — must return domain models
- Transform DB rows to domain models at the boundary
- 15-30 lines per method


