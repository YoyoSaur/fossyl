---
name: fossyl-pagination
description: Use when adding pagination to list endpoints in a fossyl project — N+1 trick, PaginatedResponse shape, offset math, hasMore semantics
license: GPL-3.0
compatibility: opencode
metadata:
  audience: fossyl-user
---

# fossyl-pagination

## Overview

The N+1 pagination pattern runs the data query and count query concurrently to avoid sequential round-trips. Offset-based pagination with `hasMore` flag.

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

Run both queries in parallel via `Promise.all`:

```typescript
export async function list(page = 1, pageSize = 20) {
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

`hasMore` is `true` when `offset + pageSize < total`. This tells the client there's at least one more page. The client uses it to conditionally show a "load more" button or enable infinite scroll.
