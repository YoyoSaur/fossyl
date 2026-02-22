import type { ProjectOptions } from '../prompts';
import { VERSIONS } from '../versions';

export function generatePackageJson(options: ProjectOptions): string {
  const dependencies: Record<string, string> = {
    '@fossyl/core': `^${VERSIONS.core}`,
  };

  const devDependencies: Record<string, string> = {
    '@types/node': '^22.0.0',
    tsx: '^4.0.0',
    typescript: '^5.8.0',
  };

  if (options.server === 'express') {
    dependencies['@fossyl/express'] = `^${VERSIONS.express}`;
    dependencies['express'] = '^4.21.0';
    devDependencies['@types/express'] = '^4.17.0';
  }

  if (options.validator === 'zod') {
    dependencies['@fossyl/zod'] = `^${VERSIONS.zod}`;
    dependencies['zod'] = '^3.24.0';
  }

  if (options.database === 'kysely') {
    dependencies['@fossyl/kysely'] = `^${VERSIONS.kysely}`;
    dependencies['kysely'] = '^0.27.0';

    if (options.dialect === 'sqlite') {
      dependencies['better-sqlite3'] = '^11.0.0';
      devDependencies['@types/better-sqlite3'] = '^7.6.0';
    } else if (options.dialect === 'mysql') {
      dependencies['mysql2'] = '^3.11.0';
    } else {
      // PostgreSQL (default)
      dependencies['pg'] = '^8.13.0';
      devDependencies['@types/pg'] = '^8.11.0';
    }
  }

  const pkg = {
    name: options.name === '.' ? 'my-fossyl-api' : options.name,
    version: '0.1.0',
    type: 'module',
    scripts: {
      dev: 'tsx watch src/index.ts',
      build: 'tsc',
      start: 'node dist/index.js',
    },
    dependencies,
    devDependencies,
  };

  return JSON.stringify(pkg, null, 2) + '\n';
}

export function generateTsConfig(): string {
  const config = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'bundler',
      esModuleInterop: true,
      strict: true,
      skipLibCheck: true,
      outDir: './dist',
      rootDir: './src',
      declaration: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  };

  return JSON.stringify(config, null, 2) + '\n';
}

export function generateEnvExample(options: ProjectOptions): string {
  let content = `# Server
PORT=3000
`;

  if (options.database === 'kysely') {
    content += `
# Database
`;
    if (options.dialect === 'sqlite') {
      content += `DATABASE_PATH=./data/app.db
`;
    } else if (options.dialect === 'mysql') {
      content += `DATABASE_URL=mysql://user:password@localhost:3306/mydb
`;
    } else {
      // PostgreSQL (default)
      content += `DATABASE_URL=postgres://user:password@localhost:5432/mydb
`;
    }
  }

  return content;
}

export function generateAuth(): string {
  return `import { authWrapper } from '@fossyl/core';

// Authentication function (customize based on your auth strategy)
export const authenticator = async (headers: Record<string, string>) => {
  // TODO: Implement your authentication logic
  // Example: JWT verification, OAuth validation, API key check, etc.
  const userId = headers['x-user-id'];
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return authWrapper({ userId });
};
`;
}

export function generateClaudeMd(options: ProjectOptions): string {
  const adapterList: string[] = [];
  if (options.server === 'express') {
    adapterList.push('`@fossyl/express`');
  }
  if (options.validator === 'zod') {
    adapterList.push('`@fossyl/zod`');
  }
  if (options.database === 'kysely') {
    adapterList.push('`@fossyl/kysely`');
  }

  // Build adapter-specific context sections
  const adapterContext: string[] = [];

  if (options.server === 'express') {
    adapterContext.push(`
### @fossyl/express

Express.js runtime adapter. Key files:
- \`adapter.ts\` - Adapter factory and Express app setup
- \`handlers.ts\` - Route handler wrappers with type matching
- \`context.ts\` - Request context management (AsyncLocalStorage)

**Handler Type Matching**: Pattern-matches on route type to call handlers correctly:
- OpenRoute: \`handler(params)\`
- AuthenticatedRoute: \`handler(params, auth)\`
- ValidatedRoute: \`handler(params, body)\`
- FullRoute: \`handler(params, auth, body)\`
- ListRoute: \`handler(params [, auth])\` with pagination

**AsyncLocalStorage Context**: Uses Node's AsyncLocalStorage to propagate request context.
\`getLogger()\`, \`getRequestId()\`, \`getDb()\` work anywhere in the call stack.

**Response Wrapping**: All responses wrapped in \`{ success: "true", type, data }\`.
Errors wrapped in \`{ success: "false", error: { code, message } }\`.`);
  } else {
    adapterContext.push(`
### Server (BYO)

You need to implement your own server adapter. See \`src/server.ts\` for the placeholder.
Reference: https://github.com/YoyoSaur/fossyl/tree/main/packages/express`);
  }

  if (options.validator === 'zod') {
    adapterContext.push(`
### @fossyl/zod

Zod validation adapter (~20 lines total).

\`\`\`typescript
import { zodValidator, zodQueryValidator } from '@fossyl/zod';

// For request body validation
const bodyValidator = zodValidator(z.object({ name: z.string() }));

// For query params validation
const queryValidator = zodQueryValidator(z.object({ search: z.string().optional() }));
\`\`\`

The key: returning a function with explicit return type \`z.infer<T>\` allows TypeScript to infer the body/query type in route handlers automatically.`);
  } else {
    adapterContext.push(`
### Validator (BYO)

You need to implement your own validators. See \`src/features/ping/validators/ping.validators.ts\`.
Reference: https://github.com/YoyoSaur/fossyl/tree/main/packages/zod`);
  }

  if (options.database === 'kysely') {
    adapterContext.push(`
### @fossyl/kysely

Kysely database adapter. Key files:
- \`adapter.ts\` - Implements DatabaseAdapter interface
- \`context.ts\` - AsyncLocalStorage for transaction context
- \`migrations.ts\` - Migration provider and utilities

**Transaction Context**: Uses AsyncLocalStorage to propagate Kysely client/transaction.
- \`withTransaction()\` - Wraps handler in a transaction
- \`getTransaction()\` - Retrieves current client anywhere in call stack

**Migrations**: Uses Kysely's built-in Migrator. Define migrations in \`src/migrations/\`.`);
  } else {
    adapterContext.push(`
### Database (BYO)

You need to implement your own database layer. See \`src/db.ts\`.
Reference: https://github.com/YoyoSaur/fossyl/tree/main/packages/kysely`);
  }

  return `# ${options.name} - AI Development Guide

**Fossyl REST API project** using ${adapterList.join(', ')}

## Claude Code Setup

Install the TypeScript LSP plugin for real-time type inference:

\`\`\`bash
# In Claude Code, run:
/plugin install typescript-lsp@claude-plugins-official

# Ensure the language server is installed:
npm install -g typescript-language-server
\`\`\`

This gives Claude instant diagnostics after every edit instead of running \`tsc\` manually.

## Project Structure

\`\`\`
src/
├── features/
│   └── ping/
│       ├── routes/ping.route.ts      # Route definitions
│       ├── services/ping.service.ts  # Business logic
│       ├── validators/               # Request validators
│       └── repo/ping.repo.ts         # Database access
├── migrations/                       # Database migrations
├── types/
│   └── db.ts                         # Database type definitions
├── db.ts                             # Database setup
├── auth.ts                           # Authentication helper
└── index.ts                          # Main entry point
\`\`\`

## Quick Start

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## Route Types & Handler Signatures

Fossyl enforces correct handler signatures via TypeScript overloads:

| Route Type | Config | Handler Signature |
|------------|--------|-------------------|
| OpenRoute | \`{}\` | \`(params) => Promise<Res>\` |
| OpenRoute + Query | \`{ queryValidator }\` | \`({ url, query }) => Promise<Res>\` |
| AuthenticatedRoute | \`{ authenticator }\` | \`(params, auth) => Promise<Res>\` |
| AuthenticatedRoute + Query | \`{ authenticator, queryValidator }\` | \`({ url, query }, auth) => Promise<Res>\` |
| ValidatedRoute | \`{ validator }\` | \`(params, body) => Promise<Res>\` |
| FullRoute | \`{ authenticator, validator }\` | \`(params, auth, body) => Promise<Res>\` |
| ListRoute | \`{ paginationConfig? }\` | \`({ url, pagination }) => Promise<PaginatedResponse>\` |

**The type system enforces this.** If you provide \`authenticator\`, the handler MUST accept \`auth\`. If you provide \`queryValidator\`, \`params\` MUST include \`query\`.

## Adding New Features

1. Create feature directory: \`src/features/{name}/\`
2. Add route: \`routes/{name}.route.ts\`
3. Add service: \`services/{name}.service.ts\`
4. Add validators: \`validators/{name}.validators.ts\`
5. Add repo (if DB): \`repo/{name}.repo.ts\`
6. Register in \`src/index.ts\`

## Adapter Reference
${adapterContext.join('\n')}

## Documentation

- Core: https://github.com/YoyoSaur/fossyl/tree/main/packages/core
- Express: https://github.com/YoyoSaur/fossyl/tree/main/packages/express
- Zod: https://github.com/YoyoSaur/fossyl/tree/main/packages/zod
- Kysely: https://github.com/YoyoSaur/fossyl/tree/main/packages/kysely
`;
}
