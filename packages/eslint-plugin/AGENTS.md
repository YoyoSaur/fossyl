# eslint-plugin-fossyl - Contributor Guide

**ESLint plugin for Fossyl projects - architecture enforcement and route quality rules**

> **AI Collaboration:** This package is in the **Green Zone** - contributions welcome. See `/CONTRIBUTING.md` for guidelines. Do not modify `@fossyl/core`.

## Source Structure

```
src/
├── index.ts                          # Plugin entry - exports rules and configs
├── rules/
│   ├── no-repo-import-outside-service.ts  # Architecture: .repo imports only in .service
│   ├── no-duplicate-routes.ts             # Route quality: no duplicate METHOD+PATH
│   ├── path-prefix-convention.ts          # Route quality: paths must start with /api/
│   ├── consistent-naming.ts               # Route quality: file name matches prefix
│   └── no-mixed-prefixes.ts              # Route quality: single prefix per file
└── utils/
    ├── rule-factory.ts              # createRule from @typescript-eslint/utils
    └── route-collector.ts           # Cross-file route analysis (singleton store)
```

## Available Configs

| Config | Rules Included | Severity |
|--------|---------------|----------|
| `recommended` | no-repo-import-outside-service, no-duplicate-routes | error |
| `all` | All 5 rules | error / warn |
| `architecture-enforcement` | no-repo-import-outside-service | error |
| `route-quality` | no-duplicate-routes, path-prefix-convention, consistent-naming, no-mixed-prefixes | error / warn |

## Usage

```typescript
// eslint.config.js
import fossyl from 'eslint-plugin-fossyl';

export default [
  {
    plugins: { fossyl },
    rules: {
      'fossyl/no-repo-import-outside-service': 'error',
      'fossyl/no-duplicate-routes': 'error',
    },
  },
];

// Or use a pre-built config:
export default [
  {
    plugins: { fossyl },
    ...fossyl.configs.recommended,
  },
];
```

## Rule Details

### no-repo-import-outside-service
Prevents importing `.repo` files anywhere except `.service` files. Enforces the architectural boundary between repositories (data access) and services (business logic).

**Options:**
- `allowImports` (string[]): Additional import paths allowed to import .repo files

### no-duplicate-routes
Prevents the same METHOD + PATH from being defined twice across the project.

### path-prefix-convention
Enforces that route paths start with a required prefix (default: `/api/`).

**Options:**
- `prefixes` (string[]): Allowed prefixes (default: `['/api/']`)

### consistent-naming
Route files should be named consistently with their `createRouter()` prefix.

### no-mixed-prefixes
All routes in a single file must share the same `createRouter()` base prefix.

## Route Collector

The `route-collector.ts` module uses a singleton store (`routeStore`) to accumulate route information across files during a single ESLint run. This enables cross-file analysis for `no-duplicate-routes`.

## Development Commands

```bash
pnpm build             # Build with tsup (cjs + esm + dts)
pnpm typecheck         # Check types with tsc --noEmit
pnpm test              # Run vitest tests
pnpm dev               # Watch mode
```

## Contribution Guidelines

When adding rules:
- Use the `createRule` factory from `utils/rule-factory.ts`
- Follow the type-safety patterns from existing rules
- Add tests for valid and invalid cases
- Update the plugin's `configs` in `index.ts`
- Register rules in the plugin's `rules` export
