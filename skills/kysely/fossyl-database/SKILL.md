---
name: fossyl-database
description: Use when setting up Kysely database in a fossyl project — connection pool, type generation, adapter integration
license: GPL-3.0
compatibility: opencode
metadata:
  audience: fossyl-user
---

# fossyl-database

## Overview

Set up Kysely with `@fossyl/kysely` adapter. Provides the `db` proxy for type-safe queries.

## Database Setup

```typescript
import { createDbProxy } from "@fossyl/kysely";
import Database from "better-sqlite3";
import type { DB } from "./types/db";

const sqlite = new Database("data.db");
export const db = createDbProxy<DB>(sqlite);
```

## Type Generation

Define DB types in `src/types/db.ts`:

```typescript
export interface PingTable {
  id: string;
  message: string;
  created_at: string;
}

export interface DB {
  ping: PingTable;
}
```
