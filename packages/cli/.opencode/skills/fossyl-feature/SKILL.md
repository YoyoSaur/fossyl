---
name: fossyl-feature
description: Use when scaffolding a new feature in a fossyl project — creates route + service + repo + validator files in src/features/<name>/
license: GPL-3.0
compatibility: opencode
metadata:
  audience: fossyl-user
---

# fossyl-feature

## Overview

Create the full file tree for a new feature: route, service, repo, validators. Always run `fossyl-domain` first to design the API surface.

## File Structure

```
src/features/<name>/
  routes/
    <name>.route.ts
  services/
    <name>.service.ts
  repo/
    <name>.repo.ts
  validators/
    <name>.validators.ts
    <name>.validators.test.ts
```

## Scaffold Order

1. Create feature directory structure
2. Write repo (data access)
3. Write validators (input schemas)
4. Write service (business logic)
5. Write route (endpoint definitions)
6. Register route in the server entry point
