# Contributing to Fossyl

## AI Collaboration Guidelines

Fossyl has a unique relationship with AI-assisted development. The core package was **deliberately handcrafted** to force AI tools to write code in a structured, type-safe way. This is a feature, not a limitation.

### The Core Principle

> **AI must NOT modify `@fossyl/core`.**

The core's type system, function overloads, and API design intentionally constrain how code is written. AI tools must respect and work within these constraints, not around them.

---

## Collaboration Zones

### Green Zone - AI Welcome

AI tools are encouraged to work in these areas:

**Adapter Packages**
- `@fossyl/express` - Express.js adapter
- `@fossyl/kysely` - Kysely database adapter
- `@fossyl/zod` - Zod validation adapter
- New adapter implementations

**CLI Package** (`@fossyl/cli`)
- Templates and scaffolding
- User prompts and flows
- New project generators

**Documentation** (`packages/docs/`)
- Writing and improving docs
- Examples and tutorials
- API reference updates

**New Packages**
- Creating new adapter packages
- Utility packages that extend Fossyl
- Integration packages

**Tests**
- Unit and integration tests for adapters
- Type tests for adapter implementations
- End-to-end testing

---

### Red Zone - AI Prohibited

**`@fossyl/core` is off-limits to AI modification.**

This includes:
- Route type definitions (`routes.types.ts`)
- Router creation logic (`router.ts`)
- Adapter interfaces (`adapters.ts`)
- Type utilities (`authWrapper`, `bodyWrapper`)
- Configuration types
- ANY source code in `packages/core/src/`

**Exceptions** (with human review):
- Typo fixes in comments
- Documentation improvements in CLAUDE.md

---

## Why Core is Protected

The core package embodies specific design decisions that enable Fossyl's magic:

1. **Function Overloads** - Carefully ordered to provide correct type inference for all 6 route types
2. **Branded Types** - `authWrapper()`/`bodyWrapper()` enable inference without explicit generics
3. **Route Type Unions** - The 6 route types map precisely to REST patterns and enforce semantics
4. **Adapter Interfaces** - Define the contract all adapters must follow

These patterns are intentionally complex at the framework level so that **user code is simple and type-safe**. AI-generated modifications risk breaking the carefully tuned type inference.

---

## Proposing Core Changes

If you believe the core needs modification:

1. **Open an issue** describing the problem or limitation
2. **Include a failing use case** - show what doesn't work
3. **Discuss alternatives** that don't require core changes
4. **If core change is necessary**, a human maintainer will implement it

---

## Working WITH the Core

AI tools should focus on:

- Understanding the type constraints core provides
- Writing adapters that correctly implement core interfaces
- Creating user-facing code that leverages core's type safety
- Generating boilerplate that fits core's patterns

The goal is to **use** the core's constraints to produce better, more consistent code.

---

## Package-Specific Guidelines

Each package has its own `CLAUDE.md` with detailed guidance:

| Package | AI Status | Notes |
|---------|-----------|-------|
| `@fossyl/core` | Prohibited | Handcrafted, do not modify |
| `@fossyl/express` | Welcome | Implement adapter interfaces |
| `@fossyl/kysely` | Welcome | Database integration |
| `@fossyl/zod` | Welcome | Validation wrapper |
| `@fossyl/cli` | Welcome | Templates and scaffolding |
| `packages/docs` | Welcome | Documentation site |

---

## Human Contributors

Human contributors may work on any part of the codebase, including core. However:

- Core changes require careful consideration of type inference impacts
- Run the full test suite including type tests before submitting
- Document any changes to the type system

---

## Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for formatting
- Follow existing patterns in each package
