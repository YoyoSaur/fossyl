# Example Project - AI Development Guide

**Fossyl REST API project (byo + zod + kysely)**

## Package Reference (AGENTS.md)
- packages/core/AGENTS.md — Route types, chain API, handler signatures (do not modify core)
- packages/zod/AGENTS.md — Zod adapter, validators
- packages/kysely/AGENTS.md — Kysely adapter, db proxy, transactions, migrations

## Skills

This project includes OpenCode skills in `.opencode/skills/` for AI-assisted development:

- `fossyl-execute` — entrance skill; reads adapter config and dispatches to domain + adapter skills
- `fossyl-domain` — project structure, architecture, and adding new features
- `fossyl-route` — builder chain, handler curry signatures, route-service composition
- `fossyl-service` — business logic, multi-repo composition, sub-services, error handling
- `fossyl-repo` — one repo per model, named CRUD exports, Kysely/external SDK adapters
- `fossyl-pagination` — offset math, N+1 trick, hasMore semantics
- `fossyl-errors` — branded error creators, error flow, no-bare-throw rule
- `fossyl-validation` — Zod schemas, validators, bodyWrapper usage
- `fossyl-validator-test` — Validator unit testing patterns
- `fossyl-database` — Database setup, db proxy, typed exports
- `fossyl-migrations` — Migration files, running migrations, schema changes
- `fossyl-add-model` — Full workflow: model → migration → types → repo

## Project Structure
...
