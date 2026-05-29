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
    ├── base.ts        # package.json, tsconfig, .env.example, auth.ts, eslint.config.js, CLAUDE.md
    ├── docker.ts      # Dockerfile, .dockerignore, docker-compose.yml
    ├── feature/
    │   └── ping.ts    # Ping route, service, repo
    ├── server/
    │   ├── express.ts # Express server entry (src/index.ts)
    │   └── byo.ts     # BYO server entry + placeholder
    ├── validator/
    │   ├── zod.ts     # Zod validators
    │   └── byo.ts     # BYO validator placeholder
    └── database/
        ├── kysely.ts  # Kysely setup, types, migrations, migrate script
        └── byo.ts     # BYO database placeholder
```

## Template System

Templates are functions that return file content strings. Each adapter choice (express/byo, zod/byo, kysely/byo) has corresponding template files.

Templates for `@fossyl/core`, `@fossyl/express`, `@fossyl/zod`, and `@fossyl/kysely` should reference their respective AGENTS.md files in `packages/<name>/AGENTS.md`.

**All projects** also receive an `eslint.config.js` (via `generateEslintConfig`) using `eslint-plugin-fossyl` for architecture enforcement.

## Package AGENTS.md Files

When generating template code for a fossyl package, load that package's AGENTS.md for implementation details:

- `packages/core/AGENTS.md` — Route types, chain API, handler signatures
- `packages/express/AGENTS.md` — Express adapter, handler wrapping, response formatting
- `packages/zod/AGENTS.md` — Zod adapter, validators
- `packages/kysely/AGENTS.md` — Kysely adapter, `db` proxy, transaction context, migrations
- `packages/eslint-plugin/AGENTS.md` — ESLint plugin rules, configs

## Generated Scripts

`generatePackageJson` now includes these scripts:

| Script      | Always?     | Command              |
| ----------- | ----------- | -------------------- |
| `typecheck` | always      | `tsc --noEmit`       |
| `lint`      | always      | `eslint src/`        |
| `migrate`   | when kysely | `tsx src/migrate.ts` |

A `src/migrate.ts` file is generated when kysely is selected (via `generateMigrateScript` in `database/kysely.ts`). It calls `runMigrations` from `@fossyl/kysely` with the project's client and migrations.

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

## Skill Copying

When scaffolding a project, the CLI also copies SKILL.md files from the monorepo root `skills/` directory into `.opencode/skills/` in the generated project. Core skills are always copied; adapter-specific skills (express, kysely, zod) are copied based on the user's adapter choices.

## Contributing

- Keep prompts clear and concise
- Test generated projects actually build and run
- Update BYO templates with helpful TODO comments
- Maintain version synchronization with other packages
