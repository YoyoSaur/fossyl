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
    eslint: '^9.0.0',
    'eslint-plugin-fossyl': `^${VERSIONS.eslintPlugin}`,
    '@typescript-eslint/parser': '^8.0.0',
    '@typescript-eslint/eslint-plugin': '^8.0.0',
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

  const scripts: Record<string, string> = {
    dev: 'tsx watch src/index.ts',
    build: 'tsc',
    start: 'node dist/index.js',
    typecheck: 'tsc --noEmit',
    lint: 'eslint src/',
  };

  if (options.database === 'kysely') {
    scripts.migrate = 'tsx src/migrate.ts';
  }

  const pkg = {
    name: options.name === '.' ? 'my-fossyl-api' : options.name,
    version: '0.1.0',
    type: 'module',
    scripts,
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
      paths: {
        '@db': ['./src/db'],
      },
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
import { AuthenticationError } from '@fossyl/express';

export const authenticator = async (headers: Record<string, string>) => {
  const userId = headers['x-user-id'];
  if (!userId) {
    throw new AuthenticationError('Unauthorized');
  }
  return authWrapper({ userId });
};
`;
}

export function generateEslintConfig(): string {
  return `import tsparser from '@typescript-eslint/parser';
import fossyl from 'eslint-plugin-fossyl';

export default [
  {
    ignores: ['**/dist/**'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: { fossyl },
    rules: {
      'fossyl/no-repo-import-outside-service': 'error',
      'fossyl/no-duplicate-routes': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
];
`;
}

export function generateClaudeMd(options: ProjectOptions): string {
  const refs = ['packages/core/AGENTS.md — Route types, chain API, handler signatures (do not modify core)'];
  if (options.server === 'express') refs.push('packages/express/AGENTS.md — Express adapter, handler wrapping, response formatting');
  if (options.validator === 'zod') refs.push('packages/zod/AGENTS.md — Zod adapter, validators');
  if (options.database === 'kysely') refs.push('packages/kysely/AGENTS.md — Kysely adapter, db proxy, transactions, migrations');

  return `# ${options.name} - AI Development Guide

**Fossyl REST API project**

## Package Reference (AGENTS.md)

When modifying or referencing code from a fossyl package, load its AGENTS.md file:

${refs.map((r) => '- ' + r).join('\n')}

## Project Structure

\`\`\`
src/
├── features/
│   └── ping/
│       ├── routes/ping.route.ts      # Route definitions (chain API)
│       ├── services/ping.service.ts  # Business logic
│       ├── validators/               # Request validators
│       └── repo/ping.repo.ts         # Database access (imports db from @db)
├── migrations/                       # Database migrations
├── types/
│   └── db.ts                         # Database type definitions
├── db.ts                             # Database setup + typed db export
├── migrate.ts                        # Migration runner (imports client from @db)
├── auth.ts                           # Authentication helper
├── eslint.config.js                  # ESLint flat config (fossyl plugin)
└── index.ts                          # Main entry point
\`\`\`

> Import \`{ db }\` from \`@db\` in your repos — it's typed \`Kysely<DB>\` via the tsconfig path alias.

## Quick Start

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## Architecture

### Chain API

Routes use a fluent chain API:

\`\`\`typescript
.createEndpoint('/path')
  .query(validator)     // optional — validates query params
  .paginate(config)     // optional — enables pagination
  .authenticator(fn)    // optional — adds auth check
  .validator(fn)        // optional — validates request body
  .get(fn)              // terminal: registers the handler
\`\`\`

### Data Flow

\`\`\`
Route (handler) → Service (business logic) → Repo (raw queries) → DB
\`\`\`

- **Services** own composition: parallel queries, hasMore calculation, etc.
- **Repos** do raw data access only — import \`{ db } from '@fossyl/kysely'\` and call Kysely methods directly.
- The \`db\` proxy resolves the active transaction client at call time — no manual context management.

## Adding New Features

1. Create feature directory: \`src/features/{name}/\`
2. Add route: \`routes/{name}.route.ts\`
3. Add service: \`services/{name}.service.ts\`
4. Add validators: \`validators/{name}.validators.ts\`
5. Add repo (if DB): \`repo/{name}.repo.ts\`
6. Register in \`src/index.ts\`

## Documentation

- Core: https://github.com/YoyoSaur/fossyl/tree/main/packages/core
- Express: https://github.com/YoyoSaur/fossyl/tree/main/packages/express
- Zod: https://github.com/YoyoSaur/fossyl/tree/main/packages/zod
- Kysely: https://github.com/YoyoSaur/fossyl/tree/main/packages/kysely
`;
}
