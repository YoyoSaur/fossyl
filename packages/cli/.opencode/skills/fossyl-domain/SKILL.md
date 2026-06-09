---
name: fossyl-domain
description: Use when brainstorming or designing the API surface for a fossyl project — enumerates endpoints, data models, auth, and adapter selection
license: GPL-3.0
compatibility: opencode
metadata:
  audience: fossyl-user
---

# fossyl-domain

## Overview

Design the complete API surface for a feature or project before writing code. Produces a structured domain spec that feeds directly into `fossyl-feature` for scaffolding.

## Process

1. **Enumerate endpoints** — list each REST endpoint with method, path, and purpose
2. **Design data model** — define entities, fields, types, and relations
3. **Plan auth model** — per-endpoint auth requirements (public, authenticated, admin, scoped)
4. **Pick adapters** — confirm which fossyl adapters apply (express, kysely, zod, etc.)

## Output

After brainstorming, produce a structured domain doc:

```markdown
## Feature: <name>

### Endpoints
- `GET /api/<resource>` — list (paginated)
- `POST /api/<resource>` — create
- `GET /api/<resource>/:id` — get by id
- `PUT /api/<resource>/:id` — update
- `DELETE /api/<resource>/:id` — remove

### Data Model
- `<Entity>`: { id, name, ... }

### Auth
- Admin: POST, PUT, DELETE
- Public: GET

### Adapters
- Server: express
- Database: kysely (sqlite)
- Validator: zod
```
