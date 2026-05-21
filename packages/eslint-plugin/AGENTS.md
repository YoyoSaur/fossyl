# eslint-plugin-fossyl - Contributor Guide

**ESLint plugin for Fossyl projects - architecture enforcement and route quality rules**

> **AI Collaboration:** This package is in the **Green Zone** - contributions welcome. See `/CONTRIBUTING.md` for guidelines. Do not modify `@fossyl/core`.

## Source Structure

```
src/
├── index.ts                          # Plugin entry - exports rules and configs
├── rules/
│   ├── no-repo-import-outside-service.ts  # Architecture: .repo imports only in .service
│   ├── no-duplicate-routes.ts             # Route quality: no duplicate METHOD+PATH
│   ├── path-prefix-convention.ts          # Route quality: paths must start with /api/
│   ├── consistent-naming.ts               # Route quality: file name matches prefix
│   └── no-mixed-prefixes.ts              # Route quality: single prefix per file
└── utils/
    ├── rule-factory.ts              # createRule from @typescript-eslint/utils
    └── route-collector.ts           # Cross-file route analysis (singleton store)
```

## Available Configs

| Config                     | Rules Included                                                                    | Severity     |
| -------------------------- | --------------------------------------------------------------------------------- | ------------ |
| `recommended`              | no-repo-import-outside-service, no-duplicate-routes                               | error        |
| `all`                      | All 5 rules                                                                       | error / warn |
| `architecture-enforcement` | no-repo-import-outside-service                                                    | error        |
| `route-quality`            | no-duplicate-routes, path-prefix-convention, consistent-naming, no-mixed-prefixes | error / warn |

## Usage

```typescript
// eslint.config.js
import fossyl from "eslint-plugin-fossyl";

export default [
  {
    plugins: { fossyl },
    rules: {
      "fossyl/no-repo-import-outside-service": "error",
      "fossyl/no-duplicate-routes": "error",
    },
  },
];

// Or use a pre-built config:
export default [
  {
    plugins: { fossyl },
    ...fossyl.configs.recommended,
  },
];
```

## Rule Details

### no-repo-import-outside-service

Prevents importing `.repo` files anywhere except `.service` files. Enforces the architectural boundary between repositories (data access) and services (business logic).

**Options:**

- `allowImports` (string[]): Additional import paths allowed to import .repo files

### no-duplicate-routes

Prevents the same METHOD + PATH from being defined twice across the project.

### path-prefix-convention

Enforces that route paths start with a required prefix (default: `/api/`).

**Options:**

- `prefixes` (string[]): Allowed prefixes (default: `['/api/']`)

### consistent-naming

Route files should be named consistently with their `createRouter()` prefix.

### no-mixed-prefixes

All routes in a single file must share the same `createRouter()` base prefix.

## Route Collector

The `route-collector.ts` module uses a singleton store (`routeStore`) to accumulate route information across files during a single ESLint run. This enables cross-file analysis for `no-duplicate-routes`.

## Chain API Handler Shapes

The `@fossyl/core` chain API uses **curried handler functions**. Each middleware layer (params, auth, body) is a synchronous function that returns the next layer. Only the innermost `() => Promise<Response>` is `async`.

The structural pattern is always:

```
(params?) => (auth?) => (body?) => async () => Promise<Response>
```

Each layer is **present or skipped** based on the chain. `params` is present when any of these are configured: a `:param` in the path, `.query()`, or `.paginate()`. Auth is present when `.authenticator()` is in the chain. Body is present when `.validator()` is in the chain.

### Handler signature by chain combination

| Chain Layers         | Handler Signature                                     |
| -------------------- | ----------------------------------------------------- |
| none                 | `async () => ({...})`                                 |
| params only          | `(params) => async () => ({...})`                     |
| auth only            | `(auth) => async () => ({...})`                       |
| params + auth        | `(params) => (auth) => async () => ({...})`           |
| body only            | `(body) => async () => ({...})`                       |
| params + body        | `(params) => (body) => async () => ({...})`           |
| auth + body          | `(auth) => (body) => async () => ({...})`             |
| params + auth + body | `(params) => (auth) => (body) => async () => ({...})` |

### Rules

1. **Only the final `() => Promise<Response>` is `async`** — all outer curry layers return synchronously.
2. **`params` is present when** the path has any `:param`, or `.query()` is chained, or `.paginate()` is chained.
3. **No `authenticator` = no auth layer** — the curry skips from params to body (or to the final response).
4. **No `validator` = no body layer** — the curry skips from auth to the final response.

### Examples

```typescript
// Full stack: params + auth + body
createEndpoint("/api/todos/:id")
  .authenticator(authenticator)
  .validator(validator)
  .put((params) => (auth) => (body) => async () => ({
    typeName: "Todo",
    ...body,
  }));

// Params + auth only (no body)
createEndpoint("/api/todos/:id")
  .authenticator(authenticator)
  .get((params) => (auth) => async () => ({
    typeName: "Todo",
    id: params.url.id,
  }));

// No params, no auth, no body
createEndpoint("/api/health").get(async () => ({ typeName: "Health", status: "ok" }));

// Auth + body only (no params)
createEndpoint("/api/todos")
  .authenticator(authenticator)
  .validator(validator)
  .post((auth) => (body) => async () => ({
    typeName: "Todo",
    ...body,
  }));

// Params only (pagination)
createEndpoint("/api/todos")
  .paginate({ defaultPageSize: 20 })
  .get((params) => async () => ({
    data: [],
    pagination: { page: 1, pageSize: 20, hasMore: false },
  }));
```

## Development Commands

```bash
pnpm build             # Build with tsup (cjs + esm + dts)
pnpm typecheck         # Check types with tsc --noEmit
pnpm test              # Run vitest tests
pnpm dev               # Watch mode
```

## Contribution Guidelines

When adding rules:

- Use the `createRule` factory from `utils/rule-factory.ts`
- Follow the type-safety patterns from existing rules
- Add tests for valid and invalid cases
- Update the plugin's `configs` in `index.ts`
- Register rules in the plugin's `rules` export
