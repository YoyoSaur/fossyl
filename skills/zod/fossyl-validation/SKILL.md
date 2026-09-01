---
name: fossyl-validation
description: Use when creating Zod validation schemas in a fossyl project — schema creation, bodyWrapper integration, custom refinements
license: GPL-3.0
compatibility: opencode
metadata:
  audience: fossyl-user
---

# fossyl-validation

## Overview

Zod schemas define request body shapes. Use `bodyWrapper` from `@fossyl/core` to wrap schemas into validators for the builder chain.

## Schema + Validator Pattern

```typescript
import { z } from "zod";
import { bodyWrapper } from "@fossyl/core";

export const createPingSchema = z.object({
  message: z.string().min(1).max(255),
});

export const updatePingSchema = z.object({
  message: z.string().min(1).max(255).optional(),
});

export const createPingValidator = bodyWrapper(createPingSchema);
export const updatePingValidator = bodyWrapper(updatePingSchema);
```

## bodyWrapper Integration

```typescript
createEndpoint()
  .validator(createPingValidator)
  .post((body: z.infer<typeof createPingSchema>) => {
    // body is fully typed
  });
```

## Adding a Validator to an Existing Feature

To create a validation schema for a route in an existing feature:

1. Add the schema and `bodyWrapper(...)` validator to the feature's validator file
   (e.g. `createTodoValidator`, `updateTodoValidator`).
2. Reference it on the route chain with `.validator(<name>)` — the handler's
   `body` layer becomes fully typed from the schema.
3. Add a companion `*.validators.test.ts` (see `fossyl-validator-test`) covering
   valid input, invalid input, and edge cases.

Keep schemas in the feature's validator file, not inline in the route.
