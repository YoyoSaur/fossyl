# @fossyl/express - Contributor Guide

**Express.js runtime adapter for fossyl**

> **AI Collaboration:** This package is in the **Green Zone** - contributions welcome. See `/CONTRIBUTING.md` for guidelines. Do not modify `@fossyl/core`.

## Source Structure

```
src/
├── index.ts      # Main exports
├── adapter.ts    # Adapter factory and Express app setup
├── handlers.ts   # Route handler wrappers with type matching
├── register.ts   # Route grouping and Express router registration
├── sorting.ts    # Route sorting (static paths before dynamic)
├── context.ts    # Request context management (AsyncLocalStorage)
├── response.ts   # Response formatting wrapper
├── errors.ts     # Error code definitions and error response creation
└── types.ts      # Adapter option types (CORS, metrics, etc.)
```

## Key Implementation Details

### Route Registration Flow

1. `adapter.register(routes)` receives route definitions from core
2. Routes are sorted (static paths before dynamic params)
3. Routes are grouped by common prefix for efficient Express routing
4. Each route is wrapped with appropriate handler based on route type

### Handler Type Matching

`handlers.ts` pattern-matches on route type to call handlers correctly:
- OpenRoute: `handler(params)`
- AuthenticatedRoute: `handler(params, auth)`
- ValidatedRoute: `handler(params, body)`
- FullRoute: `handler(params, auth, body)`
- ListRoute/AuthenticatedListRoute: `handler(params [, auth])` with pagination

### AsyncLocalStorage Context

`context.ts` uses Node's AsyncLocalStorage to propagate request context:
- Logger instance
- Request ID
- Database client/transaction (if database adapter provided)

This allows `getLogger()`, `getRequestId()`, `getDb()` to work anywhere in the call stack.

### Response Wrapping

All handler responses are wrapped in:
```typescript
{ success: "true", type: response.typeName, data: response }
```

Errors are wrapped in:
```typescript
{ success: "false", error: { code, message, details? } }
```

## Development Commands

```bash
pnpm build       # Build with tsup
pnpm typecheck   # Check types
pnpm test        # Run tests
```

## Contributing

When adding features:
- Maintain compatibility with all 6 route types from core
- Test with database adapters (transaction wrapping)
- Preserve AsyncLocalStorage context isolation
- Keep error codes consistent with `errors.ts`
