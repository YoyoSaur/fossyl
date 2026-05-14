import { ESLint } from 'eslint';
import { describe, it, expect, beforeEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { routeStore } from '../utils/route-collector';

const pluginPath = path.join(process.cwd(), 'dist', 'index.cjs');

function createConfig(rules: Record<string, string | [string, ...unknown[]]>): string {
  const rulesEntries = Object.entries(rules)
    .map(([k, v]) => {
      if (Array.isArray(v)) {
        return `"${k}": ${JSON.stringify(v)}`;
      }
      return `"${k}": "${v}"`;
    })
    .join(',\n    ');
  return [
    'const fossyl = require("' + pluginPath.replace(/\\/g, '/') + '").default;',
    'module.exports = [{',
    '  files: ["**/*.ts"],',
    '  plugins: { fossyl },',
    '  rules: {',
    '    ' + rulesEntries,
    '  },',
    '  languageOptions: { ecmaVersion: 2020, sourceType: "module" },',
    '}];',
  ].join('\n');
}

async function lintInDir(
  files: Record<string, string>,
  rules: Record<string, string | [string, ...unknown[]]>,
): Promise<Record<string, { ruleId: string | null; message: string }[]>> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fossyl-route-'));
  try {
    for (const [name, code] of Object.entries(files)) {
      fs.writeFileSync(path.join(tmpDir, name), code);
    }
    fs.writeFileSync(path.join(tmpDir, 'eslint.config.cjs'), createConfig(rules));
    const eslint = new ESLint({ cwd: tmpDir });
    const results = await eslint.lintFiles(Object.keys(files));
    const output: Record<string, { ruleId: string | null; message: string }[]> = {};
    for (const result of results) {
      const name = path.basename(result.filePath);
      output[name] = result.messages.map((m) => ({
        ruleId: m.ruleId,
        message: m.message,
      }));
    }
    return output;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

beforeEach(() => {
  routeStore.reset();
});

describe('no-duplicate-routes', () => {
  it('should allow unique routes across files', async () => {
    const results = await lintInDir(
      {
        'users.route.ts':
          'import { createRouter } from "@fossyl/core";\n' +
          'const router = createRouter("/users");\n' +
          'export const list = router.createEndpoint("/users").list({ handler: async () => ({ data: [], pagination: { page: 1, pageSize: 20, hasMore: false } }) });\n',
        'posts.route.ts':
          'import { createRouter } from "@fossyl/core";\n' +
          'const router = createRouter("/posts");\n' +
          'export const list = router.createEndpoint("/posts").get({ handler: async () => ({}) });\n',
      },
      { 'fossyl/no-duplicate-routes': 'error' },
    );

    expect(results['users.route.ts']).toHaveLength(0);
    expect(results['posts.route.ts']).toHaveLength(0);
  });

  it('should flag duplicate routes across files', async () => {
    const results = await lintInDir(
      {
        'users.route.ts':
          'import { createRouter } from "@fossyl/core";\n' +
          'const router = createRouter("/users");\n' +
          'export const get = router.createEndpoint("/users/:id").get({ handler: async () => ({}) });\n',
        'duplicate.route.ts':
          'import { createRouter } from "@fossyl/core";\n' +
          'const router = createRouter("/users");\n' +
          'export const alsoGet = router.createEndpoint("/users/:id").get({ handler: async () => ({}) });\n',
      },
      { 'fossyl/no-duplicate-routes': 'error' },
    );

    const dupErrors = results['duplicate.route.ts'] || [];
    const hasError = dupErrors.some(
      (e) => e.ruleId === 'fossyl/no-duplicate-routes',
    );
    expect(hasError).toBe(true);
  });
});

describe('path-prefix-convention', () => {
  it('should allow routes with valid prefix', async () => {
    const results = await lintInDir(
      {
        'users.route.ts':
          'import { createRouter } from "@fossyl/core";\n' +
          'const router = createRouter("/api/users");\n' +
          'export const get = router.createEndpoint("/api/users/:id").get({ handler: async () => ({}) });\n',
      },
      { 'fossyl/path-prefix-convention': 'warn' },
    );
    expect(results['users.route.ts']).toHaveLength(0);
  });

  it('should flag routes without /api/ prefix', async () => {
    const results = await lintInDir(
      {
        'users.route.ts':
          'import { createRouter } from "@fossyl/core";\n' +
          'const router = createRouter("/users");\n' +
          'export const get = router.createEndpoint("/users/:id").get({ handler: async () => ({}) });\n',
      },
      { 'fossyl/path-prefix-convention': 'warn' },
    );
    const errors = results['users.route.ts'].filter(
      (e) => e.ruleId === 'fossyl/path-prefix-convention',
    );
    expect(errors).toHaveLength(1);
  });
});

describe('no-mixed-prefixes', () => {
  it('should allow single prefix per file', async () => {
    const results = await lintInDir(
      {
        'users.route.ts':
          'import { createRouter } from "@fossyl/core";\n' +
          'const router = createRouter("/users");\n' +
          'export const get = router.createEndpoint("/users/:id").get({ handler: async () => ({}) });\n' +
          'export const list = router.createEndpoint("/users").get({ handler: async () => ({}) });\n',
      },
      { 'fossyl/no-mixed-prefixes': 'warn' },
    );
    const errors = results['users.route.ts'].filter(
      (e) => e.ruleId === 'fossyl/no-mixed-prefixes',
    );
    expect(errors).toHaveLength(0);
  });

  it('should flag multiple createRouter calls with different prefixes', async () => {
    const results = await lintInDir(
      {
        'users.route.ts':
          'import { createRouter } from "@fossyl/core";\n' +
          'const userRouter = createRouter("/users");\n' +
          'const adminRouter = createRouter("/admin");\n' +
          'export const get = userRouter.createEndpoint("/users/:id").get({ handler: async () => ({}) });\n',
      },
      { 'fossyl/no-mixed-prefixes': 'warn' },
    );
    const errors = results['users.route.ts'].filter(
      (e) => e.ruleId === 'fossyl/no-mixed-prefixes',
    );
    expect(errors).toHaveLength(1);
  });
});

describe('consistent-naming', () => {
  it('should allow matching file name and prefix', async () => {
    const results = await lintInDir(
      {
        'users.route.ts':
          'import { createRouter } from "@fossyl/core";\n' +
          'const router = createRouter("/users");\n' +
          'export const list = router.createEndpoint("/users").get({ handler: async () => ({}) });\n',
      },
      { 'fossyl/consistent-naming': 'warn' },
    );
    expect(results['users.route.ts']).toHaveLength(0);
  });
});
