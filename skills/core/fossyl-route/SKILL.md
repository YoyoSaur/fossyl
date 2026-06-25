---
name: fossyl-route
description: Use when defining route handlers in a fossyl project — builder chain, handler curry signatures, authWrapper/bodyWrapper, route-service composition
license: GPL-3.0
compatibility: opencode
metadata:
  audience: fossyl-user
---

# fossyl-route

## Overview

Routes use a typed builder chain. Every chain step is optional — the type system enforces the correct handler signature based on which steps are used.

Routes compose services freely. A single route handler may call multiple services.

## Pattern: createRouter + Per-Endpoint createEndpoint

A `createRouter(path)` provides a path prefix. Each export calls `router.createEndpoint(...)` with the full chain, keeping every endpoint self-contained:

```typescript
import { createRouter } from "@fossyl/core";
import { authenticator } from "../../auth";
import * as todosService from "./todos.service";
import { listTodoQueryValidator, createTodoValidator, updateTodoValidator } from "./todos.validators";

const router = createRouter("/todos");

export const listTodos = router
  .createEndpoint("/todos")
  .authenticator(authenticator)
  .query(listTodoQueryValidator)
  .paginate({ defaultPageSize: 20, maxPageSize: 100 })
  .get((params) => async () => {
    const result = await todosService.listTodos(
      params.auth.userId,
      params.pagination,
      { done: params.query.done as boolean | undefined }
    );
    return {
      typeName: "TodoList",
      data: result.data,
      pagination: result.pagination,
    };
  });

export const getTodo = router
  .createEndpoint("/todos/:id")
  .authenticator(authenticator)
  .get((params) => async () => {
    const todo = await todosService.getTodo(params.url.id, params.auth.userId);
    return { typeName: "Todo", ...todo };
  });

export const createTodo = router
  .createEndpoint("/todos")
  .authenticator(authenticator)
  .validator(createTodoValidator)
  .post((_params) => (auth) => (body) => async () => {
    const todo = await todosService.createTodo(body.title, body.due_date, auth.userId);
    return { typeName: "Todo", ...todo };
  });

export const updateTodo = router
  .createEndpoint("/todos/:id")
  .authenticator(authenticator)
  .validator(updateTodoValidator)
  .put((params) => (auth) => (body) => async () => {
    const todo = await todosService.updateTodo(params.url.id, body, auth.userId);
    return { typeName: "Todo", ...todo };
  });
```

Each `export const` is a complete route definition — no hidden shared middleware.

**Why per-endpoint chains?** From an AI agent's perspective, this is the right trade-off. A single export shows the entire chain so the handler signature, params shape, and disabled middleware are immediately visible without cross-referencing. The `createRouter` is just a path prefix convenience.

## Builder Chain

```typescript
createEndpoint("/todos")
  .query(queryValidator)       // optional — validates + types query params
  .paginate({ pageSize: 20 })  // optional — adds pagination to params + response
  .authenticator(authFn)       // optional — adds auth layer
  .validator(bodyValidator)    // optional — validates request body
  .get(handler)                // terminal: get | post | put | delete
```

**Order is enforced by the type system.** Each step returns a different router type exposing only valid next methods:

| Step | Returns | Next methods |
|---|---|---|
| `createEndpoint(path)` | `Endpoint` | `.query()` |
| `.query(v)` | `QueryableRouter` | `.paginate()`, `.authenticator()` |
| `.paginate(c)` | `PaginatedRouter` | `.authenticator()` |
| `.authenticator(f)` | `AuthenticatedRouter` | `.validator()` (if body allowed), terminal |
| `.validator(f)` | `ValidatedRouter` | terminal |
| Terminal `.get/post/put/delete(h)` | `void` (registers the route) | — |

## Handler Curry Signatures

The handler is a curried function. Each layer (params, auth, body) is a synchronous function that returns the next layer. Only the innermost `() => Promise<Response>` is `async`.

```
(params?) => (auth?) => (body?) => async () => Promise<Response>
```

**When `.validator()` is used**, the curry expands to separate auth/body layers for type safety. When no validator is used, everything accumulates into a single params layer.

| Chain Layers | Handler Signature |
|---|---|
| none | `async () => ({...})` |
| params only | `(params) => async () => ({...})` |
| auth only | `(params) => async () => ({...})` — `params.auth` is available |
| params + auth | `(params) => async () => ({...})` — `params.auth` is available |
| body only | `(body) => async () => ({...})` |
| params + body | `(params) => async () => ({...})` — `params.body` is available |
| auth + body | `(_params) => (auth) => (body) => async () => ({...})` |
| params + auth + body | `(params) => (auth) => (body) => async () => ({...})` |

- `params` includes `url: { ... }` for path params, `query: { ... }` if `.query()` is used, and `pagination: { ... }` if `.paginate()` is used
- `auth` type is whatever your `authWrapper` returns
- `body` type is whatever your `bodyWrapper` validates against
- Use `_params` when the params layer exists but is unused

## authWrapper

```typescript
import { authWrapper } from "@fossyl/core";

const authenticate = authWrapper((req) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return { error: fossylUnauthorized("Missing user") };
  return { auth: { userId } };
});
```

## bodyWrapper

```typescript
import { bodyWrapper } from "@fossyl/core";

const myValidator = bodyWrapper(myZodSchema);
```

## Route Registration

Import and call each route function in your server entry:

```typescript
import { listTodos, getTodo, createTodo, updateTodo } from "./features/todos/todos.route";

listTodos(router);
getTodo(router);
createTodo(router);
updateTodo(router);
```

## Route Composition

Handlers call services, never repos directly. Multiple services per handler is fine:

```typescript
export const approveTimesheet = router
  .createEndpoint("/timesheets/:id/approve")
  .authenticator(authenticator)
  .post((params) => async () => {
    const ts = await timesheetService.getById(params.url.id);
    if (ts.status !== "pending") throw fossylConflict("Already processed");
    return timesheetService.approve(params.auth.userId, params.url.id);
  });
```

## Key Rules

- Only the final `() => Promise<Response>` is `async` — outer curry layers return synchronously
- Keep handlers thin — delegate to services, never import repos directly
- Return `{ typeName: "Name", ...data }` — `typeName` is required for discriminated unions
- Each `export const` shows the full chain — an agent reading one export has everything it needs
