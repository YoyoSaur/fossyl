# @fossyl/core

**Type-safe REST API framework designed for AI-assisted development**

Fossyl is a TypeScript REST API framework that provides:
- Full type inference for routes, parameters, and responses
- REST semantics enforcement at compile-time
- Validator-library agnostic design
- Type-safe authentication and query parameter validation
- Configuration-driven code generation with framework adapters

## Installation

```bash
npm install @fossyl/core
# or
pnpm add @fossyl/core
```

## Quick Start

```bash
# Create a new project with the CLI
npx fossyl --create my-api
```

## Core Concepts

### 1. Creating a Router

```typescript
import { createRouter } from '@fossyl/core';

const router = createRouter('/api'); // Optional base path
```

### 2. Basic Routes

```typescript
// Simple GET endpoint
const getUserRoute = router.createEndpoint('/users/:id').get({
  handler: async ({ url }) => {
    const userId = url.id; // Fully typed from URL params
    return {
      typeName: 'User' as const,
      id: userId,
      name: 'John Doe'
    };
  }
});

// POST endpoint with body validation
const createUserRoute = router.createEndpoint('/users').post({
  validator: (data): { name: string; email: string } => {
    // Your validation logic (use any validator library)
    return data as { name: string; email: string };
  },
  handler: async ({ url }, body) => {
    // body type is inferred from validator return type
    return {
      typeName: 'User' as const,
      id: '123',
      ...body
    };
  }
});
```

### 3. Authentication

Authentication functions **must** return a `Promise`. This allows for async operations like OAuth, database lookups, JWT verification, etc.

```typescript
import { authWrapper } from '@fossyl/core';

// Define your async authentication function
const authenticator = async (headers: Record<string, string>) => {
  // Perform async operations: OAuth, JWT verification, database lookup, etc.
  return authWrapper({
    userId: headers['x-user-id'],
    role: headers['x-user-role']
  });
};

// Use in routes
const protectedRoute = router.createEndpoint('/protected').get({
  authenticator,
  handler: async ({ url }, auth) => {
    // auth is fully typed from authWrapper return
    return {
      typeName: 'Protected' as const,
      message: `Hello user ${auth.userId}`
    };
  }
});
```

### 4. Query Parameters

```typescript
const searchRoute = router.createEndpoint('/search').get({
  queryValidator: (data): { q: string; limit?: number } => {
    return data as { q: string; limit?: number };
  },
  handler: async ({ url, query }) => {
    // query type is inferred from queryValidator
    return {
      typeName: 'SearchResult' as const,
      results: [],
      query: query.q
    };
  }
});
```

## REST Method Types

Available methods: `get`, `post`, `put`, `delete`, `list`

**REST Semantics Enforcement:**
- `GET` and `DELETE` cannot have a body validator
- `POST` and `PUT` require a body validator
- `list` is always GET with automatic pagination
- All methods can have authentication and query validation

**Handler Parameter Order:**
- Routes with body validation: `handler(params, [auth,] body)`
- Routes without body validation: `handler(params [, auth])`
- List routes: `handler({ url, query, pagination } [, auth])`

## Route Types

Fossyl provides six distinct route types:

| Type | Auth | Body | Use For |
|------|------|------|---------|
| OpenRoute | No | No | Public endpoints, health checks |
| AuthenticatedRoute | Yes | No | Protected GET/DELETE endpoints |
| ValidatedRoute | No | Yes | Public POST/PUT (e.g., registration) |
| FullRoute | Yes | Yes | Protected POST/PUT (most common) |
| ListRoute | No | No | Public paginated collections |
| AuthenticatedListRoute | Yes | No | Protected paginated collections |

## List Routes (Pagination)

```typescript
const listItems = router.createEndpoint('/items').list({
  paginationConfig: { defaultPageSize: 20, maxPageSize: 100 },
  handler: async ({ pagination }) => {
    const items = await db.selectFrom('items')
      .limit(pagination.pageSize + 1)  // N+1 trick for hasMore
      .offset((pagination.page - 1) * pagination.pageSize)
      .execute();

    const hasMore = items.length > pagination.pageSize;

    return {
      data: hasMore ? items.slice(0, pagination.pageSize) : items,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        hasMore,
      },
    };
  },
});
```

## Response Format

All route handlers must return objects with a `typeName` property:

```typescript
const handler = async (params) => {
  return {
    typeName: 'UserResponse' as const, // Required!
    id: '123',
    name: 'John Doe'
  };
};
```

The framework wraps responses in a standardized format:
```typescript
{
  success: "true",
  type: "UserResponse",
  data: { typeName: 'UserResponse', id: '123', name: 'John Doe' }
}
```

## Adapters

Use Fossyl with framework adapters:

```typescript
import { createRouter } from '@fossyl/core';
import { expressAdapter } from '@fossyl/express';

const api = createRouter('/api');
const routes = [
  api.createEndpoint('/users').get({
    handler: async () => ({
      typeName: 'UserList' as const,
      users: []
    })
  })
];

const adapter = expressAdapter({ cors: true });
adapter.register(routes);
await adapter.listen(3000);
```

**Available adapters:**
- `@fossyl/express` - Express.js runtime adapter
- `@fossyl/zod` - Zod validation adapter
- `@fossyl/kysely` - Kysely database adapter

## Type Exports

```typescript
import type {
  // Route types
  OpenRoute,
  AuthenticatedRoute,
  ValidatedRoute,
  FullRoute,
  ListRoute,
  AuthenticatedListRoute,
  Route,

  // Core types
  Endpoint,
  Router,
  Params,
  ResponseData,
  ApiResponse,

  // Pagination
  PaginationParams,
  PaginationConfig,
  PaginatedResponse,

  // Adapter interfaces
  FrameworkAdapter,
  DatabaseAdapter,
  ValidationAdapter,
  LoggerAdapter,
} from '@fossyl/core';
```

## Tips for AI Assistants

1. **Type Inference**: Let types flow from validators and authenticators
2. **Response Format**: Always include `typeName` in response objects
3. **Validation**: Use any library (Zod, Yup, io-ts) - just return the validated type
4. **Authentication**: Always use `authWrapper()` and make auth functions async
5. **Handler Order**: `(params, [auth,] body)` for POST/PUT, `(params [, auth])` for GET/DELETE
