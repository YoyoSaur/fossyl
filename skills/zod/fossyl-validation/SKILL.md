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
