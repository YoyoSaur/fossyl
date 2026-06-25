# Example Project - AI Development Guide

**Fossyl REST API project (express + zod + byo)**

## Package Reference

Documentation for fossyl packages is available at:

- Core: https://github.com/YoyoSaur/fossyl/tree/main/packages/core
- Express: https://github.com/YoyoSaur/fossyl/tree/main/packages/express
- Zod: https://github.com/YoyoSaur/fossyl/tree/main/packages/zod
## Skills

This project includes OpenCode skills in `.opencode/skills/` for AI-assisted development:

- `fossyl-execute` — entrance skill; reads adapter config and dispatches to domain + adapter skills
- `fossyl-domain` — project structure, architecture, and adding new features
- `fossyl-route` — builder chain, handler curry signatures, route-service composition
- `fossyl-service` — business logic, multi-repo composition, sub-services, error handling
- `fossyl-repo` — one repo per model, named CRUD exports, Kysely/external SDK adapters
- `fossyl-pagination` — offset math, N+1 trick, hasMore semantics
- `fossyl-errors` — branded error creators, error flow, no-bare-throw rule
- `fossyl-server` — Express server setup, middleware, route registration
- `fossyl-context` — Request context, auth extraction, logging
- `fossyl-validation` — Zod schemas, validators, bodyWrapper usage
- `fossyl-validator-test` — Validator unit testing patterns

## Project Structure
...
