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

Zod schemas define both request body shapes and response shapes. Use `bodyWrapper` from `@fossyl/core` to wrap request schemas into validators for the builder chain. Use `zodValidator` from `@fossyl/zod` for the mandatory `.response()` base step.

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

## Response Schema + Validator (.response())

The mandatory `.response()` step (Issue #17) validates the handler's return. Response schemas must include `typeName` as a literal so responses stay self-describing.

```typescript
import { z } from "zod";
import { zodValidator } from "@fossyl/zod";

export const pingResponseSchema = z.object({
  typeName: z.literal("Ping"),
  message: z.string(),
});

export const pingResponseValidator = zodValidator(pingResponseSchema);
```

Use it as the first chain step:

```typescript
createEndpoint("/ping")
  .response(pingResponseValidator)
  .get(() => async () => ({ typeName: "Ping", message: "pong" }));
```

Validation runs in dev only (`NODE_ENV !== "production"`); zero production cost. For `.paginate()` routes, each item in `result.data` is validated independently against the item schema.

## bodyWrapper Integration

```typescript
createEndpoint()
  .validator(createPingValidator)
  .post((body: z.infer<typeof createPingSchema>) => {
    // body is fully typed
  });
```
