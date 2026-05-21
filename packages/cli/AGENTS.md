# fossyl CLI - Contributor Guide

**CLI for scaffolding fossyl projects**

> Do not modify `@fossyl/core`.

## Source Structure

```
src/
├── index.ts           # CLI entry point and arg parsing
├── prompts.ts         # Interactive prompts (@clack/prompts)
├── scaffold.ts        # File generation orchestration + disk writing
├── versions.ts        # Auto-generated package versions
└── templates/
    ├── base.ts        # Base project files (package.json, tsconfig, etc.)
    ├── feature/
    │   └── ping.ts    # Ping feature (routes, services, repo)
    ├── server/
    │   ├── express.ts
    │   └── byo.ts
    ├── validator/
    │   ├── zod.ts
    │   └── byo.ts
    └── database/
        ├── kysely.ts
        └── byo.ts
```

## Template System

Templates are functions that return file content strings. Each adapter choice (express/byo, zod/byo, kysely/byo) has corresponding template files.

Templates for `@fossyl/core`, `@fossyl/express`, `@fossyl/zod`, and `@fossyl/kysely` should reference their respective AGENTS.md files in `packages/<name>/AGENTS.md`.

## Package AGENTS.md Files

When generating template code for a fossyl package, load that package's AGENTS.md for implementation details:

- `packages/core/AGENTS.md` — Route types, chain API, handler signatures
- `packages/express/AGENTS.md` — Express adapter, handler wrapping, response formatting
- `packages/zod/AGENTS.md` — Zod adapter, validators
- `packages/kysely/AGENTS.md` — Kysely adapter, `db` proxy, transaction context, migrations

## Auto-generated versions.ts

`versions.ts` is generated at build time from workspace package versions. This ensures generated projects use matching versions of fossyl packages.

## Development Commands

```bash
pnpm build       # Build with tsup
pnpm typecheck   # Check types

# Test locally
node bin/fossyl.js --help
node bin/fossyl.js --create /tmp/test-app
```

## Contributing

- Keep prompts clear and concise
- Test generated projects actually build and run
- Update BYO templates with helpful TODO comments
- Maintain version synchronization with other packages
