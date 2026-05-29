---
name: fossyl-execute
description: Use when starting plan execution for a fossyl project — reads adapter config and dispatches to correct domain + adapter skills
license: GPL-3.0
compatibility: opencode
metadata:
  audience: fossyl-user-approved
---

# fossyl-execute

## Overview

Loads the correct set of fossyl skills based on the project's adapter choices (express, kysely, zod, etc.) and dispatches plan execution. Always runs first before any fossyl feature work.

## When to Use

- **Always** when starting execution of a plan in a fossyl project
- Before creating new features, routes, services, repos, or validators
- When unsure which skills apply to the current task

## Dispatch Flow

1. Read project config — inspect `src/` for adapter imports (express, kysely, zod)
2. Load core skills:
   - Load `fossyl-domain` if designing API surface
   - Load `fossyl-feature` if scaffolding a feature
   - Load `fossyl-route` / `fossyl-service` / `fossyl-repo` if implementing routes/services/repos
   - Load `fossyl-pagination` if using pagination
   - Load `fossyl-errors` if handling errors
3. Load adapter skills:
   - If express detected → load `fossyl-server`, `fossyl-context`
   - If kysely detected → load `fossyl-database`, `fossyl-migrations`, `fossyl-add-model`
   - If zod detected → load `fossyl-validation`, `fossyl-validator-test`
4. Execute plan using loaded skills

## Common Tasks → Required Skills

| Task | Skills to Load |
|---|---|
| Add a new API endpoint | fossyl-domain, fossyl-route, fossyl-service, fossyl-repo, fossyl-validation, fossyl-errors |
| Add a new database table | fossyl-add-model, fossyl-migrations |
| Set up project | fossyl-domain, fossyl-server, fossyl-database, fossyl-validation |
| Add pagination to list endpoint | fossyl-pagination, fossyl-route, fossyl-service |
