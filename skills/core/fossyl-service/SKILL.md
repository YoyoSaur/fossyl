---
name: fossyl-service
description: Use when implementing service layer in a fossyl project — business logic, error handling, N+1 pagination math, repo imports
license: GPL-3.0
compatibility: opencode
metadata:
  audience: fossyl-user
---

# fossyl-service

## Overview

Services contain business logic between routes and repos. They import repo functions, compose data, handle errors, and manage pagination math.

## Structure

```typescript
import type { Auth } from "@fossyl/core";
import * as myRepo from "../repo/my.repo";
import { fossylNotFound } from "../errors";

export async function list(auth: Auth, page = 1, pageSize = 20) {
  // Pagination math
  const offset = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    myRepo.findAll(offset, pageSize),
    myRepo.countAll(),
  ]);
  return { items, total, page, pageSize };
}

export async function getById(auth: Auth, id: string) {
  const item = await myRepo.findById(id);
  if (!item) throw fossylNotFound("Item not found");
  return item;
}
```

## Error Handling

Wrap 3rd-party errors (DB, network) into fossyl-branded errors using `try/catch`. Never throw bare `Error` — always use `fossyl-errors`.

## Dependencies

- Import `../repo/<name>.repo` — never import db directly
- Import `../errors` for error creators
- Import `@fossyl/core` for types only
