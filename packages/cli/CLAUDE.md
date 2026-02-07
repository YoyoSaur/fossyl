# fossyl CLI - AI Development Guide

**CLI for scaffolding fossyl projects**

> **AI Collaboration:** This package is in the **Green Zone** - AI contributions welcome. See `/CONTRIBUTING.md` for guidelines. Do not modify `@fossyl/core`.

## Overview

The `fossyl` CLI is an interactive project scaffolding tool that generates new fossyl API projects with your choice of adapters.

## Installation

```bash
# Use directly with npx (recommended)
npx fossyl --create my-api

# Or install globally
npm install -g fossyl
fossyl --create my-api
```

## Usage

### Create a New Project

```bash
npx fossyl --create <project-name>
```

Interactive prompts will guide you through selecting:

1. **Server adapter**: Express (recommended) | Bring Your Own
2. **Validation library**: Zod (recommended) | Bring Your Own
3. **Database adapter**: Kysely (recommended) | Bring Your Own

### CLI Options

```bash
npx fossyl --create <name>   # Create new project
npx fossyl --help            # Show help
npx fossyl --version         # Show version
```

### Examples

```bash
# Create a new project named "my-api"
npx fossyl --create my-api

# Create a new project in the current directory
npx fossyl --create .
```

## Generated Project Structure

```
<project-name>/
├── src/
│   ├── features/
│   │   └── ping/
│   │       ├── routes/ping.route.ts      # All 4 route types demonstrated
│   │       ├── services/ping.service.ts  # Business logic
│   │       ├── validators/               # Request validators
│   │       └── repo/ping.repo.ts         # Database access
│   ├── migrations/
│   │   ├── index.ts                      # Migration registry
│   │   └── 001_create_ping.ts            # Example migration
│   ├── types/
│   │   └── db.ts                         # DB type definitions
│   ├── db.ts                             # Database setup
│   └── index.ts                          # Main entry point
├── package.json
├── tsconfig.json
├── .env.example
└── CLAUDE.md
```

## BYO (Bring Your Own) Mode

When selecting BYO for any adapter, the CLI generates placeholder files with:

- TODO comments explaining what needs to be implemented
- Links to reference implementations in the fossyl monorepo
- Example code snippets for common patterns

## Available Adapters

| Adapter | Package | Description |
|---------|---------|-------------|
| Express | `@fossyl/express` | Express.js runtime adapter |
| Zod | `@fossyl/zod` | Zod validation adapter |
| Kysely | `@fossyl/kysely` | Kysely database adapter |

## Package Source

This package is part of the fossyl monorepo:
- Source: `packages/cli/`
- Repository: https://github.com/YoyoSaur/fossyl

## Development

```bash
# Build the CLI
pnpm --filter fossyl build

# Test locally
node packages/cli/bin/fossyl.js --help
node packages/cli/bin/fossyl.js --create /tmp/test-app
```
