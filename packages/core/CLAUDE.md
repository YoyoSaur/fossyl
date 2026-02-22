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