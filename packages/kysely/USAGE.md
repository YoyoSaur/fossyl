# @fossyl/kysely

**Kysely runtime database adapter for fossyl**

This adapter provides:
- **Kysely** for type-safe query building
- **Migrations** with up/down support
- **AsyncLocalStorage** for transaction context propagation
- **Automatic transactions** for write operations

## Installation

```bash
npm install @fossyl/kysely kysely pg
```

## Quick Start

```typescript
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { kyselyAdapter, createMigrationProvider } from '@fossyl/kysely';
import { expressAdapter } from '@fossyl/express';
import type { DB } from './generated/types';

const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString: process.env.DATABASE_URL }),
  }),
});

const migrations = createMigrationProvider({
  '001_create_users': {
    async up(db) {
      await db.schema
        .createTable('users')
        .addColumn('id', 'uuid', (col) => col.primaryKey())
        .addColumn('name', 'varchar(255)', (col) => col.notNull())
        .execute();
    },
    async down(db) {
      await db.schema.dropTable('users').execute();
    },
  },
});

const database = kyselyAdapter({ client: db, migrations, autoMigrate: true });
const adapter = expressAdapter({ database, cors: true });

adapter.register(routes);
await adapter.listen(3000);
```

## Adapter Options

```typescript
const database = kyselyAdapter({
  client: db,                    // Kysely instance (required)
  migrations?: MigrationProvider, // Migration provider (optional)
  autoMigrate?: boolean,         // Run migrations on startup (default: false)
  defaultTransaction?: boolean,  // Use transactions for writes (default: true)
});
```

## Accessing Database in Handlers

Use `getTransaction()` anywhere in your call stack:

```typescript
import { getTransaction } from '@fossyl/kysely';
import type { DB } from './generated/types';

async function createUser(name: string, email: string) {
  const db = getTransaction<DB>();
  return db
    .insertInto('users')
    .values({ name, email })
    .returningAll()
    .executeTakeFirstOrThrow();
}
```

## Migrations

### Writing Migrations

```typescript
import { sql } from 'kysely';
import { defineMigration } from '@fossyl/kysely';

export default defineMigration({
  async up(db) {
    await db.schema
      .createTable('users')
      .addColumn('id', 'uuid', (col) =>
        col.primaryKey().defaultTo(sql`gen_random_uuid()`)
      )
      .addColumn('name', 'varchar(255)', (col) => col.notNull())
      .execute();
  },
  async down(db) {
    await db.schema.dropTable('users').execute();
  },
});
```

### Running Migrations Manually

```typescript
import { runMigrations, rollbackMigration, getMigrationStatus } from '@fossyl/kysely';

await runMigrations(db, migrations);
await rollbackMigration(db, migrations);
const status = await getMigrationStatus(db, migrations);
```

## Transaction Behavior

The framework adapter automatically wraps handlers:
- **POST/PUT routes**: `withTransaction()` - commits on success, rolls back on error
- **GET/DELETE routes**: `withClient()` - no transaction

## Type Generation

Use `kysely-codegen` for existing databases:

```bash
pnpm add -D kysely-codegen
DATABASE_URL=postgres://... npx kysely-codegen --out-file src/generated/types.ts
```

## Exports

```typescript
// Main adapter
export { kyselyAdapter } from '@fossyl/kysely';

// Context accessor
export { getTransaction } from '@fossyl/kysely';

// Migration utilities
export {
  createMigrationProvider,
  defineMigration,
  runMigrations,
  rollbackMigration,
  getMigrationStatus,
} from '@fossyl/kysely';
```
