# fossyl CLI - Contributor Guide

**CLI for scaffolding fossyl projects**

> **AI Collaboration:** This package is in the **Green Zone** - contributions welcome. See `/CONTRIBUTING.md` for guidelines. Do not modify `@fossyl/core`.

## Source Structure

```
src/
├── index.ts           # CLI entry point and arg parsing
├── prompts.ts         # Interactive prompts (inquirer)
├── generator.ts       # Project generation logic
├── versions.ts        # Auto-generated package versions
└── templates/
    ├── base.ts        # Base project files (package.json, tsconfig, etc.)
    ├── feature/       # Feature scaffolding templates
    │   └── ping.ts    # Example ping feature
    ├── server/        # Server adapter templates
    │   ├── express.ts
    │   └── byo.ts
    ├── validator/     # Validation adapter templates
    │   ├── zod.ts
    │   └── byo.ts
    └── database/      # Database adapter templates
        ├── kysely.ts
        └── byo.ts
```

## Template System

Templates are functions that return file content strings:

```typescript
export const getPackageJson = (options: ProjectOptions): string => {
  return JSON.stringify({
    name: options.name,
    // ...
  }, null, 2);
};
```

Each adapter choice (express/byo, zod/byo, kysely/byo) has corresponding template files.

## Auto-generated versions.ts

`versions.ts` is generated at build time from workspace package versions. This ensures generated projects use matching versions of fossyl packages.

## Development Commands

```bash
pnpm build       # Build with tsup
pnpm typecheck   # Check types

# Test locally
node bin/fossyl.js --help
node bin/fossyl.js --create /tmp/test-app
```

## Contributing

When adding features:
- Keep prompts clear and concise
- Test generated projects actually build and run
- Update BYO templates with helpful TODO comments
- Maintain version synchronization with other packages
