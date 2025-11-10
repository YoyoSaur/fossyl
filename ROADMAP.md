# Fossyl Development Roadmap

This roadmap outlines the development plan for Fossyl, organized by priority and dependency order.

All tasks are tracked as GitHub issues: https://github.com/YoyoSaur/fossyl/issues

## Core Philosophy

Fossyl follows a **pure functional, types-only** design philosophy:
- ✅ **Pure functions only** - No classes, no interfaces
- ✅ **Types-only approach** - Minimal runtime overhead
- ✅ **Validators are functions** - `(data: unknown) => T`
- ✅ **Zero dependencies in core** - Adapters are separate packages
- ✅ **Immutable data** - `readonly` types everywhere

---

## Phase 1: Foundation (High Priority)

These tasks establish the core architecture and must be completed first.

### #2: Refactor validation layer to pure functional types
**Labels:** `enhancement`, `priority:high`, `core`, `validation`

Remove hardcoded Zod dependency. Create pure functional validator abstraction:
```typescript
export type Validator<T> = (data: unknown) => T;
export const zodAdapter = <T>(schema: ZodType<T>): Validator<T> =>
  (data) => schema.parse(data);
```

**Dependencies:** None
**Blocks:** #7, #15, #17

---

### #3: Write CLAUDE.md for AI-assisted development
**Labels:** `documentation`, `priority:high`, `ai`

Critical for AI code generation. Must include:
- Complete CRUD template
- All 4 route types with examples
- Pure functional design emphasis
- Current limitations

**Dependencies:** None
**Impact:** Enables AI to generate Fossyl code effectively

---

### #4: Write comprehensive core documentation
**Labels:** `documentation`, `priority:high`, `core`

Document the core library:
- README with pure functional philosophy
- API reference for all types
- Type system guide
- Design philosophy explanation

**Dependencies:** #2 (validator types should be finalized)
**Impact:** Onboarding for new contributors

---

### #5: Build Express runtime adapter
**Labels:** `enhancement`, `priority:high`, `runtime-adapter`

First runtime adapter - converts Fossyl routes to Express handlers.

**Dependencies:** #2 (needs validator abstraction)
**Blocks:** #11 (Express+Prisma starter)

---

### #10: Set up monorepo structure with pnpm workspaces
**Labels:** `infrastructure`, `priority:medium`

Organize as monorepo:
```
packages/
├── core/
├── validation-*/
├── express/
├── hono/
└── fastify/
starters/
└── express-prisma/
```

**Dependencies:** None
**Impact:** Enables multi-package development

---

## Phase 2: Core Features

### #6: Add route builder customization types
**Labels:** `enhancement`, `core`, `types`

Enable custom metadata and extensions for route builders.

**Dependencies:** None

---

### #7: Create validation adapters for Yup and ArkType
**Labels:** `enhancement`, `validation`

Provide alternative validators:
```typescript
export const yupAdapter = <T>(schema: yup.Schema<T>): Validator<T> => ...
export const arkAdapter = <T>(schema: Type<T>): Validator<T> => ...
```

**Dependencies:** #2 (validator abstraction)

---

### #14: Implement standard error handling pattern
**Labels:** `enhancement`, `error-handling`

Pure functional error types:
```typescript
export type FossylError = {
  readonly type: 'validation' | 'authentication' | 'not-found' | 'internal';
  readonly message: string;
  readonly statusCode: number;
};

export const createError = (...) => ({ ... }); // Pure function
```

**Dependencies:** None
**Impact:** Consistent error handling across adapters

---

### #15: Add query parameter validation support
**Labels:** `enhancement`, `validation`

Runtime validation for query params:
```typescript
queryValidator: zodAdapter(z.object({
  limit: z.coerce.number().optional()
}))
```

**Dependencies:** #2 (validator abstraction)

---

## Phase 3: Runtime Adapters

### #8: Build Hono runtime adapter
**Labels:** `enhancement`, `runtime-adapter`

Hono adapter following Express pattern.

**Dependencies:** #5 (reference Express implementation)
**Blocks:** #12 (Hono+Drizzle starter)

---

### #9: Build Fastify runtime adapter
**Labels:** `enhancement`, `runtime-adapter`

Fastify adapter following Express pattern.

**Dependencies:** #5 (reference Express implementation)
**Blocks:** #13 (Fastify+Kysely starter)

---

## Phase 4: Starter Templates

### #11: Create Express + Prisma starter template
**Labels:** `starter-template`, `priority:medium`

Complete opinionated starter with:
- Full CRUD example
- Authentication (JWT)
- Error handling
- Database integration

**Dependencies:** #5 (Express adapter), #14 (error handling)
**Impact:** Reference implementation for AI and developers

---

### #12: Create Hono + Drizzle starter template
**Labels:** `starter-template`

Edge-optimized starter for Cloudflare Workers.

**Dependencies:** #8 (Hono adapter)

---

### #13: Create Fastify + Kysely starter template
**Labels:** `starter-template`

High-performance starter with raw SQL.

**Dependencies:** #9 (Fastify adapter)

---

## Phase 5: Advanced Features (Future)

### #16: Add middleware support (functional approach)
**Labels:** `enhancement`, `middleware`, `future`

Pure functional middleware:
```typescript
export type Middleware<In, Out> = (context: In) => Out | Promise<Out>;
```

**Dependencies:** None

---

### #17: Implement response type validation
**Labels:** `enhancement`, `validation`, `future`

Optional dev-mode response validation.

**Dependencies:** #2 (validator abstraction)

---

### #18: Generate OpenAPI/Swagger documentation from routes
**Labels:** `enhancement`, `documentation`, `future`

Auto-generate OpenAPI specs from route definitions.

**Dependencies:** #15 (query validation for complete specs)

---

### #19: Add HTTP status code typing to responses
**Labels:** `enhancement`, `types`, `future`

Type-safe status codes:
```typescript
return response({ todo }, 200);
return response({ error: 'Not found' }, 404);
```

**Dependencies:** None

---

### #20: Implement pagination pattern and types
**Labels:** `enhancement`, `future`

Standard pagination helpers:
```typescript
export const paginate = <T>(items: readonly T[], total: number, params: PaginationParams) => ...
```

**Dependencies:** None

---

### #21: Create testing utilities and patterns
**Labels:** `testing`, `future`

Pure functional testing helpers:
```typescript
export const testHandler = async <R extends Route>(route: R, params: {...}) => ...
```

**Dependencies:** None

---

## Documentation & Meta

### #1: Write comprehensive FAQ documentation
**Labels:** `documentation`

Cover common questions, troubleshooting, design decisions.

**Dependencies:** #4 (core docs should be complete)

---

### #22: Add contribution guidelines
**Labels:** `documentation`, `meta`

CONTRIBUTING.md with:
- Pure functional code style
- PR process
- Testing requirements
- Architecture principles

**Dependencies:** #10 (monorepo structure should be established)

---

## Suggested Implementation Order

**Immediate (Weeks 1-2):**
1. #2 - Validator refactoring (blocks many other features)
2. #10 - Monorepo setup (enables parallel package development)
3. #5 - Express adapter (first runtime implementation)
4. #3 - CLAUDE.md (enables AI-assisted development)

**Short-term (Weeks 3-4):**
5. #4 - Core documentation
6. #14 - Error handling
7. #11 - Express+Prisma starter (reference implementation)
8. #7 - Additional validators (Yup, ArkType)

**Medium-term (Weeks 5-8):**
9. #8, #9 - Hono and Fastify adapters
10. #12, #13 - Additional starters
11. #15 - Query validation
12. #6 - Route builder customization

**Future (Weeks 9+):**
13. #16-#21 - Advanced features
14. #1, #22 - Documentation polish

---

## Notes

- All implementations must follow **pure functional, types-only** philosophy
- No classes or interfaces - use types and pure functions
- Keep core dependency-free
- Maintain backward compatibility
- All new features need tests
- Update CLAUDE.md for AI-relevant changes

---

Generated from conversation with Claude Code
Last updated: 2025-11-07
