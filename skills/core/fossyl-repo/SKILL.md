---
name: fossyl-repo
description: Use when implementing the repo layer in a fossyl project — named CRUD exports, db proxy usage, query patterns
license: GPL-3.0
compatibility: opencode
metadata:
  audience: fossyl-user
---

# fossyl-repo

## Overview

Repos are the data access layer. Each feature has one repo file exporting named CRUD functions. Repos use the `db` proxy from `@fossyl/kysely` or a raw connection.

## CRUD Exports

```typescript
import { db } from "../../db";
import type { MyEntity } from "../../types/db";

export function findAll(offset: number, limit: number) {
  return db
    .selectFrom("my_entity")
    .selectAll()
    .offset(offset)
    .limit(limit)
    .execute();
}

export function findById(id: string) {
  return db
    .selectFrom("my_entity")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
}

export function create(data: NewMyEntity) {
  return db
    .insertInto("my_entity")
    .values(data)
    .returningAll()
    .executeTakeFirst();
}

export function update(id: string, data: Partial<MyEntity>) {
  return db
    .updateTable("my_entity")
    .set(data)
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirst();
}

export function remove(id: string) {
  return db
    .deleteFrom("my_entity")
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirst();
}

export function countAll() {
  return db
    .selectFrom("my_entity")
    .select(db.fn.countAll<number>())
    .executeTakeFirstOrThrow()
    .then((r) => Number(r.count));
}
```

## Naming Convention

| Function | Purpose |
|---|---|
| `findAll` | Paginated list with offset/limit |
| `findById` | Single item by primary key |
| `create` | Insert and return |
| `update` | Update and return |
| `remove` | Delete and return |
| `countAll` | Total count for pagination |
