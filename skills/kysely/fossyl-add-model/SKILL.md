---
name: fossyl-add-model
description: Use when adding a new database table/model in a fossyl project — migration file, types, seed data, relation wiring
license: GPL-3.0
compatibility: opencode
metadata:
  audience: fossyl-user
---

# fossyl-add-model

## Overview

Add a new database model: create migration, define types, wire relations. Always increment the migration counter.

## Steps

1. Create migration file `src/migrations/002_create_<table>.ts`
2. Add table type to `src/types/db.ts`
3. If related to existing tables, add foreign key columns
4. Run `pnpm migrate` to apply

## Migration Pattern

```typescript
import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("my_new_table")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("ping_id", "text", (col) =>
      col.references("ping.id").onDelete("cascade")
    )
    .addColumn("created_at", "text", (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("my_new_table").execute();
}
```
