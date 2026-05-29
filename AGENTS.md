# Fossyl Monorepo

> Type-safe REST API framework for AI-assisted development.
> **Package manager:** pnpm@11.1.2 — do not use npm or yarn.

## Critical Constraint

**Do NOT modify `packages/core/src/`** — `@fossyl/core` is handcrafted and AI-prohibited (Red Zone). Route types, adapter interfaces, branded types (`authWrapper`/`bodyWrapper`), and router creation are intentionally complex. AI may read core but must not edit it.

Green Zone (AI welcome): `@fossyl/express`, `@fossyl/kysely`, `@fossyl/zod`, `fossyl` (CLI), `fossyl-docs`, `eslint-plugin-fossyl`, `@fossyl/regression-testing`, new packages.

## Commands

| Command | Scope | Notes |
|---|---|---|
| `pnpm install` | all | Installs workspace deps |
| `pnpm build` | `packages/*` | tsup → CJS+ESM+dts; also copies `USAGE.md`→`dist/AGENTS.md` |
| `pnpm test` | `packages/*` | Only cli, eslint-plugin, regression-testing have tests (vitest); core/express/zod/kysely have none |
| `pnpm lint` | `packages/*/src/**/*.ts` | ESLint v9 flat config using local `eslint-plugin-fossyl` |
| `pnpm typecheck` | `packages/*` | `tsc --noEmit` per package |
| `pnpm format` | repo-wide | Prettier (100 width, 2 spaces, double quotes, trailingComma es5) |
| `pnpm dev` | `packages/*` | Parallel tsup --watch |
| `pnpm dev:docs` | fossyl-docs | Astro dev server |
| `pnpm build:docs` | fossyl-docs | Astro production build |

## Package Map

| Package | Test? | Notes |
|---|---|---|
| `packages/core` | type tests only | **DO NOT MODIFY** |
| `packages/cli` | vitest | Pre-build: `scripts/generate-versions.js` |
| `packages/express` | none | |
| `packages/zod` | none | |
| `packages/kysely` | none | |
| `packages/eslint-plugin` | vitest | 7 rules, 4 configs, needs `pnpm build` before root lint |
| `packages/regression-testing` | vitest | Docker compose tests via `test:docker` |
| `packages/docs` | none | Astro + Starlight, deployed on Vercel |

## Each Package Has AGENTS.md

Every package has an `AGENTS.md` with source structure and implementation guidance. `CLAUDE.md` files just delegate to `AGENTS.md`. Load a package's `AGENTS.md` when working inside it.

## Build Quirks

- Published packages copy `USAGE.md` → `dist/AGENTS.md` during build (tool-agnostic AI context for consumers).
- CLI runs `scripts/generate-versions.js` pre-tsup to inject workspace version mapping.
- `@astrojs/starlight@0.39.2` has a local patch at `patches/`.

### Pre-commit Hook (removed)

`scripts/update-claude-md.mjs` was deleted — it was tied to the old `CLAUDE.md` content flow. No automated CLAUDE.md updates.

## Missing Infrastructure

- No GitHub Actions workflows yet.
- No `opencode.json` at root.
