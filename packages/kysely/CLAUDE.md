# @fossyl/kysely - Contributor Guide

**Kysely runtime database adapter for fossyl**

> **AI Collaboration:** This package is in the **Green Zone** - contributions welcome. See `/CONTRIBUTING.md` for guidelines. Do not modify `@fossyl/core`.

## Source Structure

```
src/
├── index.ts        # Main exports
├── adapter.ts      # Adapter factory implementing DatabaseAdapter interface
├── context.ts      # AsyncLocalStorage for transaction context
├── migrations.ts   # Migration provider and utilities
└── types.ts        # Type definitions
```

## Key Implementation Details

### DatabaseAdapter Interface

This package implements the `DatabaseAdapter` interface from `@fossyl/core`:

```typescript
type DatabaseAdapter = {
  type: 'database';
  name: string;
  onStartup: () => Promise<void>;
  withTransaction: <T>(fn: () => Promise<T>) => Promise<T>;
  withClient: <T>(fn: () => Promise<T>) => Promise<T>;
};
```

### Transaction Context

Uses Node's AsyncLocalStorage to propagate the Kysely client/transaction:

- `withTransaction()` starts a transaction and stores it in AsyncLocalStorage
- `withClient()` stores the base client in AsyncLocalStorage (no transaction)
- `getTransaction()` retrieves the current client from AsyncLocalStorage

This allows database access anywhere in the call stack without passing the client explicitly.

### Migration System

Uses Kysely's built-in Migrator with a custom provider:

- `createMigrationProvider()` wraps migration objects for Kysely's Migrator
- `defineMigration()` is a type helper for writing migrations
- Migrations are tracked in `kysely_migration` table

## Development Commands

```bash
pnpm build       # Build with tsup
pnpm typecheck   # Check types
pnpm test        # Run tests
```

## Contributing

When adding features:
- Maintain compatibility with the `DatabaseAdapter` interface from core
- Preserve AsyncLocalStorage context isolation
- Test transaction rollback behavior
- Support both PostgreSQL and other Kysely dialects where possible
