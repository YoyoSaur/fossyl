# Example Project - AI Development Guide

**Fossyl REST API project (express + byo + byo)**

## Package Reference (AGENTS.md)
- packages/core/AGENTS.md — Route types, chain API, handler signatures (do not modify core)
- packages/express/AGENTS.md — Express adapter, handler wrapping, response formatting

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

## Project Structure
...
