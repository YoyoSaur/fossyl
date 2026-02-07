# @fossyl/core - Contributor Guide

## DO NOT MODIFY THIS PACKAGE

The `@fossyl/core` package was **deliberately handcrafted** to force AI tools to write code in a structured, type-safe way. This is the foundation that makes Fossyl work.

### What This Means

- **No source code changes** in `src/`
- **No type definition changes** - the route types, adapter interfaces, and utilities are carefully designed
- **No "improvements"** - the complexity is intentional and enables simplicity elsewhere

### Why Core is Protected

1. **Function Overloads** - Carefully ordered for correct type inference across all 6 route types
2. **Branded Types** - `authWrapper()`/`bodyWrapper()` enable inference without explicit generics
3. **Route Type Unions** - Map precisely to REST patterns and enforce semantics at compile-time
4. **Adapter Interfaces** - Define the exact contract all adapters must follow

AI modifications risk breaking the finely-tuned type inference that makes Fossyl useful.

### What AI CAN Do

- **Read and understand** the core to write correct adapter code
- **Use the types** to build adapters, services, and user-facing code
- **Reference USAGE.md** to understand API patterns
- Fix typos in comments/docs (with human review)

### If Core Needs Changes

1. Open an issue describing the limitation
2. Include a failing use case
3. A human maintainer will implement the fix

See `/CONTRIBUTING.md` for full collaboration guidelines.

---

## Source Structure

```
src/
├── index.ts                           # Main exports
├── adapters.ts                        # Adapter interface types
├── config.ts                          # Configuration definitions
├── validation.ts                      # Validation result types
└── router/
    ├── router.ts                      # Router and endpoint creation (function overloads)
    └── types/
        ├── routes.types.ts            # Route type unions + authWrapper/bodyWrapper
        ├── configuration.types.ts     # ValidatorFunction, AuthenticationFunction
        ├── router-creation.types.ts   # Endpoint and Router types
        └── params.types.ts            # URL parameter parsing
```

## Key Design Decisions

### Function Overloads in router.ts

The `.get()`, `.post()`, `.put()`, `.delete()`, and `.list()` methods use carefully ordered TypeScript overloads to infer the correct handler signature based on what's provided:

- With `authenticator` + `validator` → FullRoute handler signature
- With `authenticator` only → AuthenticatedRoute handler signature
- With `validator` only → ValidatedRoute handler signature
- With neither → OpenRoute handler signature

**Order matters.** Changing overload order breaks type inference.

### Branded Types

`authWrapper()` and `bodyWrapper()` add a brand (`__auth` / `__body`) that the type system uses to distinguish auth data from body data, enabling correct parameter inference without explicit generics.

### Route Type Union

The 6 route types form a discriminated union based on what validation is present. This enables adapters to pattern-match on route type and handle each appropriately.

## Development Commands

```bash
pnpm build          # Build with tsup
pnpm typecheck      # Check types
pnpm test:types     # Run type tests
```

## Human Contributors

If you're a human maintainer making core changes:
- Run the full test suite including type tests
- Test all 6 route types with an adapter
- Document any changes to type inference behavior
- Consider backwards compatibility for existing adapters
