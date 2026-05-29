---
name: fossyl-validator-test
description: Use when writing tests for Zod validators in a fossyl project — schema tests, edge cases, type assertion tests
license: GPL-3.0
compatibility: opencode
metadata:
  audience: fossyl-user
---

# fossyl-validator-test

## Overview

Test Zod schemas for correct validation: valid inputs pass, invalid inputs fail, edge cases handled.

## Test Pattern

```typescript
import { describe, expect, it } from "vitest";
import { createPingSchema } from "./ping.validators";

describe("createPingSchema", () => {
  it("accepts valid input", () => {
    const result = createPingSchema.safeParse({ message: "hello" });
    expect(result.success).toBe(true);
  });

  it("rejects empty message", () => {
    const result = createPingSchema.safeParse({ message: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing message", () => {
    const result = createPingSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects message over 255 chars", () => {
    const result = createPingSchema.safeParse({ message: "x".repeat(256) });
    expect(result.success).toBe(false);
  });
});
```

## Coverage

Test every field constraint: min, max, optional, required, custom refinements. Use `safeParse` for error-checking tests.
