# @fossyl/zod - Contributor Guide

**Zod validation adapter for fossyl**

> **AI Collaboration:** This package is in the **Green Zone** - contributions welcome. See `/CONTRIBUTING.md` for guidelines. Do not modify `@fossyl/core`.

## Source Structure

```
src/
└── index.ts    # Everything - zodValidator and zodQueryValidator
```

This is a tiny package. The entire implementation is ~20 lines.

## Implementation

```typescript
export const zodValidator = <T extends z.ZodType>(schema: T) => {
  return (data: unknown): z.infer<T> => schema.parse(data);
};

export const zodQueryValidator = zodValidator; // Same implementation
```

The key insight: returning a function with explicit return type `z.infer<T>` allows TypeScript to infer the body/query type in route handlers.

## Why Two Functions?

`zodValidator` and `zodQueryValidator` are functionally identical but semantically distinct:
- `zodValidator` is used for `validator` (request body)
- `zodQueryValidator` is used for `queryValidator` (URL query params)

This makes code more readable and self-documenting.

## Development Commands

```bash
pnpm build       # Build with tsup
pnpm typecheck   # Check types
```

## Contributing

This package is intentionally minimal. If adding features:
- Keep the API surface small
- Maintain type inference (the whole point of this package)
- Consider if the feature belongs here or in user code
