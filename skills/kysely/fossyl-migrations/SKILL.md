---
name: fossyl-migrations
description: Use when working with database migrations in a fossyl project — migration setup, file structure, up/down patterns
license: GPL-3.0
compatibility: opencode
metadata:
  audience: fossyl-user
---

# fossyl-migrations

## Overview

Kysely migrations for schema changes. Each migration is a file exporting `up` and `down` functions.

## Migration File

```typescript
// src/migrations/001_create_ping.ts
import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("ping")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("message", "text", (col) => col.notNull())
    .addColumn("created_at", "text", (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("ping").execute();
}
```

## Migration Runner

```typescript
// src/migrate.ts
import { runMigrations } from "@fossyl/kysely";
// calls db.migrate...
```
