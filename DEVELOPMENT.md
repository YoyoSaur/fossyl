# Fossyl Development Guide

## Setup

This is a monorepo managed with pnpm.

### Install Dependencies

```bash
pnpm install
```

### Build All Packages

```bash
pnpm build
```

### Run Tests

```bash
pnpm test
```

## Package Structure

```
fossyl/
├── packages/
│   ├── core/          # Main fossyl package — DO NOT MODIFY
│   ├── cli/           # CLI scaffolding tool
│   ├── express/       # Express.js adapter
│   ├── zod/           # Zod validation adapter
│   ├── kysely/        # Kysely database adapter
│   ├── eslint-plugin/ # ESLint rules for fossyl projects
│   ├── regression-testing/  # Full-framework integration tests
│   └── docs/          # Documentation site (Astro + Starlight)
└── package.json       # Root package.json
```
