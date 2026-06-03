---
name: fossyl-repo
description: Use when implementing the repo layer in a fossyl project — one repo per model, named CRUD exports, Kysely queries, external SDK adapters, domain model transformation
license: GPL-3.0
compatibility: opencode
metadata:
  audience: fossyl-user
---

# fossyl-repo

## Overview

One repo file per model. Repos are thin (15–30 lines) data adapters. A repo can wrap a Kysely query or an external SDK call — the service layer treats both identically.

Repos can only be imported by service files (enforced by `no-repo-import-outside-service` linter rule). A single repo may be imported by at most one service.

## Kysely Repo (Internal DB)

```typescript
import { db } from "../../db";
import type { MyEntity, NewMyEntity } from "../../types/db";

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
    .executeTakeFirstOrThrow();
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

## External SDK Repo (Third-Party API)

Repos can wrap external API clients from SDKs. Transform the third-party model into your domain model at the repo boundary:

```typescript
import { CheckClient } from "@checkhq/sdk";
import type { Timesheet } from "../../types/domain";

const checkClient = new CheckClient(process.env.CHECK_API_KEY!);

export async function findByEmployee(employeeId: string): Promise<Timesheet[]> {
  const raw = await checkClient.timesheets.list({ employeeId });
  return raw.map((t) => ({
    id: t.id,
    employeeId: t.employee_id,
    hours: t.total_hours,
    status: t.status,
    weekEnding: t.week_ending,
  }));
}

export async function approve(id: string): Promise<Timesheet> {
  const raw = await checkClient.timesheets.approve(id);
  return mapCheckTimesheetToDomain(raw);
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
| `findBy{Field}` | Custom lookup (e.g. `findByEmployee`) |

## Rules

- Import `{ db }` from `../../db` (or `@db` via tsconfig alias) for Kysely repos
- Import SDK clients directly for external API repos
- Transform external models to domain models at the repo boundary — never leak SDK types
- Never throw errors — return `undefined` for not-found, let the service handle errors
- One repo file per model, grouped by feature
