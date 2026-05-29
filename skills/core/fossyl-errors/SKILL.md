---
name: fossyl-errors
description: Use when handling errors in a fossyl project — fossyl-branded error creators, error flow, no-bare-throw rule
license: GPL-3.0
compatibility: opencode
metadata:
  audience: fossyl-user
---

# fossyl-errors

## Overview

Fossyl uses branded error creators that produce structured error responses. Never throw bare `Error` — always use error creators from `src/errors.ts`.

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
  → service (throws branded errors)
    → repo (throws db errors — service wraps them)
```

## Rules

- **No bare throws:** `throw fossylNotFound(...)` not `throw new Error(...)`
- **Service wraps repo errors:** `try { repo.call() } catch (e) { throw fossylInternal("...") }`
- **Route handlers catch and pass to error middleware** — the express adapter handles this automatically
