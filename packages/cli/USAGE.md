# fossyl

**CLI for scaffolding fossyl projects**

## Installation

```bash
# Use directly with npx (recommended)
npx fossyl --create my-api

# Or install globally
npm install -g fossyl
fossyl --create my-api
```

## Usage

```bash
npx fossyl --create <project-name>
```

Interactive prompts will guide you through selecting:

1. **Server adapter**: Express (recommended) | Bring Your Own
2. **Validation library**: Zod (recommended) | Bring Your Own
3. **Database adapter**: Kysely (recommended) | Bring Your Own

## CLI Options

```bash
npx fossyl --create <name>   # Create new project
npx fossyl --help            # Show help
npx fossyl --version         # Show version
```

## Generated Project Structure

```
<project-name>/
├── src/
│   ├── features/
│   │   └── ping/
│   │       ├── routes/ping.route.ts
│   │       ├── services/ping.service.ts
│   │       ├── validators/
│   │       └── repo/ping.repo.ts
│   ├── migrations/
│   │   ├── index.ts
│   │   └── 001_create_ping.ts
│   ├── types/
│   │   └── db.ts
│   ├── db.ts
│   └── index.ts
├── package.json
├── tsconfig.json
├── .env.example
└── CLAUDE.md
```

## BYO (Bring Your Own) Mode

When selecting BYO for any adapter, the CLI generates placeholder files with:
- TODO comments explaining what needs to be implemented
- Links to reference implementations
- Example code snippets

## Available Adapters

| Adapter | Package | Description |
|---------|---------|-------------|
| Express | `@fossyl/express` | Express.js runtime adapter |
| Zod | `@fossyl/zod` | Zod validation adapter |
| Kysely | `@fossyl/kysely` | Kysely database adapter |
