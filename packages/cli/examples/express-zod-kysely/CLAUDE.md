# fossyl-example - AI Development Guide

**Fossyl REST API project**

## Package Reference (AGENTS.md)

When modifying or referencing code from a fossyl package, load its AGENTS.md file:

- packages/core/AGENTS.md — Route types, chain API, handler signatures (do not modify core)
- packages/express/AGENTS.md — Express adapter, handler wrapping, response formatting
- packages/zod/AGENTS.md — Zod adapter, validators
- packages/kysely/AGENTS.md — Kysely adapter, db proxy, transactions, migrations

## Project Structure

```
src/
├── features/
│   └── ping/
│       ├── routes/ping.route.ts      # Route definitions (chain API)
│       ├── services/ping.service.ts  # Business logic
│       ├── validators/               # Request validators
│       └── repo/ping.repo.ts         # Database access (imports db from @db)
├── migrations/                       # Database migrations
├── types/
│   └── db.ts                         # Database type definitions
├── db.ts                             # Database setup + typed db export
├── migrate.ts                        # Migration runner (imports client from @db)
├── auth.ts                           # Authentication helper
├── eslint.config.js                  # ESLint flat config (fossyl plugin)
└── index.ts                          # Main entry point
```

> Import `{ db }` from `@db` in your repos — it's typed `Kysely<DB>` via the tsconfig path alias.

## Quick Start

```bash
pnpm install
pnpm dev
```

## Architecture

### Chain API

Routes use a fluent chain API:

```typescript
.createEndpoint('/path')
  .query(validator)     // optional — validates query params
  .paginate(config)     // optional — enables pagination
  .authenticator(fn)    // optional — adds auth check
  .validator(fn)        // optional — validates request body
  .get(fn)              // terminal: registers the handler
```

### Data Flow

```
Route (handler) → Service (business logic) → Repo (raw queries) → DB
```

- **Services** own composition: parallel queries, hasMore calculation, etc.
- **Repos** do raw data access only — import `{ db } from '@fossyl/kysely'` and call Kysely methods directly.
- The `db` proxy resolves the active transaction client at call time — no manual context management.

## Adding New Features

1. Create feature directory: `src/features/{name}/`
2. Add route: `routes/{name}.route.ts`
3. Add service: `services/{name}.service.ts`
4. Add validators: `validators/{name}.validators.ts`
5. Add repo (if DB): `repo/{name}.repo.ts`
6. Register in `src/index.ts`

## Documentation

- Core: https://github.com/YoyoSaur/fossyl/tree/main/packages/core
- Express: https://github.com/YoyoSaur/fossyl/tree/main/packages/express
- Zod: https://github.com/YoyoSaur/fossyl/tree/main/packages/zod
- Kysely: https://github.com/YoyoSaur/fossyl/tree/main/packages/kysely
