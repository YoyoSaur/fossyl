// @code-block-start: generated-claude-md
<!-- When you scaffold a project with `npx fossyl --create my-api`,
  a CLAUDE.md is generated with project-specific AI instructions: -->

# Project: my-api

## Technology Stack
- **Framework:** Express.js (via @fossyl/express)
- **Validation:** Zod (via @fossyl/zod)
- **Database:** Kysely (via @fossyl/kysely)

## Architecture
- Routes are in `src/features/*/routes/`
- Services in `src/features/*/services/`
- Repositories in `src/features/*/repo/`
- Validators in `src/features/*/validators/`
- Database migrations in `src/migrations/`

## Route Pattern
```typescript
// Always use createRouter() from 'fossyl'
// Always include typeName in responses
// Use authWrapper() for authentication
```

## DO NOT
- Modify @fossyl/core source code
- Remove typeName from response objects
- Use explicit generics where inference works
<!-- @code-block-end: generated-claude-md -->
