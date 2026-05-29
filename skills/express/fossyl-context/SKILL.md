---
name: fossyl-context
description: Use when working with Express request context in a fossyl project — req/res extraction, request-scoped state, auth context
license: GPL-3.0
compatibility: opencode
metadata:
  audience: fossyl-user
---

# fossyl-context

## Overview

Express context extracts `req` and `res` from the incoming request and provides request-scoped state. Used by `authWrapper` and route handlers.

## Context Extraction

```typescript
import { fossylExpress } from "@fossyl/express";

const router = fossylExpress(app);
// router provides typed req/res access to handlers
```

## Request-scoped State

Access request properties in `authWrapper`:

```typescript
const authenticate = authWrapper((req) => {
  const token = req.headers.authorization;
  const userId = req.headers["x-user-id"];
  // ...
});
```

The `req` object carries headers, query params, and body. Use `authWrapper` to extract typed auth context from the raw request.
