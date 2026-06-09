---
name: fossyl-pagination
description: Use when adding pagination to list endpoints in a fossyl project — chain integration, PaginatedResponse shape, offset math, hasMore semantics
license: GPL-3.0
compatibility: opencode
metadata:
  audience: fossyl-user
---

# fossyl-pagination

## Overview

Pagination in Fossyl uses the `.paginate()` chain step, which extends `params` with a `pagination` object and wraps the response in `PaginatedResponse<T>`. Under the hood it's offset-based with a `hasMore` flag.

## Chain Integration

```typescript
createEndpoint("/api/todos")
  .paginate({ defaultPageSize: 20 })   // adds pagination support
  .get((params) => async () => ({
    typeName: "TodoList",
    items: [],
    pagination: { page: 1, pageSize: 20, total: 0, hasMore: false },
  }));
```

When `.paginate()` is used, `params` gains a `pagination` field with `{ page, pageSize }` from the query string. The return type is automatically typed as `PaginatedResponse<T>`.

## PaginatedResponse Shape

```typescript
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
```

## Offset Math

```typescript
function paginate(page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;
  return { offset, limit: pageSize };
}
```

## N+1 Trick

Run data query and count query concurrently:

```typescript
export async function list(auth: Auth, page = 1, pageSize = 20) {
  const { offset, limit } = paginate(page, pageSize);
  const [items, total] = await Promise.all([
    repo.findAll(offset, limit),
    repo.countAll(),
  ]);
  return {
    items,
    total,
    page,
    pageSize,
    hasMore: offset + limit < total,
  };
}
```

## hasMore Semantics

`hasMore` is `true` when `offset + pageSize < total`. The client uses this to conditionally show a "load more" button or enable infinite scroll.

## Query vs Paginate

`.query()` and `.paginate()` can be used together. `.query()` validates arbitrary query params, `.paginate()` specifically adds `page`/`pageSize` query params and wraps the response. They compose: `.query(qv).paginate(c)`.
