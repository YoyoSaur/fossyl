---
name: fossyl-errors
description: Use when handling errors in a fossyl project — fossyl-branded error creators, error flow, no-bare-throw rule, wrapping third-party errors
license: GPL-3.0
compatibility: opencode
metadata:
  audience: fossyl-user
---

# fossyl-errors

## Overview

Fossyl uses branded error creators from `src/errors.ts` (or `@fossyl/core`). These produce structured objects that the framework formats into HTTP responses. Never throw bare `Error`.

## Error Creators

```typescript
export function fossylNotFound(message: string) {
  return { status: 404, code: "NOT_FOUND", message };
}

export function fossylConflict(message: string) {
  return { status: 409, code: "CONFLICT", message };
}

export function fossylUnauthorized(message: string) {
  return { status: 401, code: "UNAUTHORIZED", message };
}

export function fossylBadRequest(message: string) {
  return { status: 400, code: "BAD_REQUEST", message };
}

export function fossylInternal(message: string) {
  return { status: 500, code: "INTERNAL_ERROR", message };
}
```

## Error Flow

```
route handler (catches thrown errors)
  → service (throws branded errors, wraps repo errors)
    → repo (returns undefined for not-found — service handles)
```

## Rules

- **No bare throws:** `throw fossylNotFound(...)` not `throw new Error(...)`
- **Service wraps third-party errors:** `try { repo.call() } catch (e) { throw fossylInternal("...") }`
- **Repos never throw** — return `undefined` for not-found, let the service decide
- **Route handlers do not catch** — the adapter catches branded errors and formats the HTTP response automatically
- Use `fossylNotFound` when a requested resource doesn't exist (404)
- Use `fossylConflict` when the request conflicts with current state (409)
- Use `fossylUnauthorized` when auth fails (401)
- Use `fossylBadRequest` for invalid input not caught by the validator (400)
- Use `fossylInternal` for unexpected errors (500) — wrap third-party errors here
