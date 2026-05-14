import { ESLint } from 'eslint';
import { describe, it, expect, beforeEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { createRequire } from 'node:module';
import { routeStore } from '../utils/route-collector';

const _require = createRequire(import.meta.url);
const pluginPath = path.join(process.cwd(), 'dist', 'index.cjs');
const testAppSrc = path.join(process.cwd(), 'test-app', 'src');
const parserPath = _require.resolve('@typescript-eslint/parser');

function createIntegrationConfig(): string {
  return [
    'const fossyl = require("' + pluginPath.replace(/\\/g, '/') + '").default;',
    'const tsparser = require("' + parserPath.replace(/\\/g, '/') + '");',
    'module.exports = [{',
    '  files: ["**/*.ts"],',
    '  plugins: { fossyl },',
    '  rules: {',
    '    "fossyl/no-repo-import-outside-service": "error",',
    '    "fossyl/no-duplicate-routes": "error",',
    '    "fossyl/path-prefix-convention": ["warn", { "prefixes": ["/api/"] }],',
    '    "fossyl/consistent-naming": "warn",',
    '    "fossyl/no-mixed-prefixes": "warn",',
    '  },',
    '  languageOptions: {',
    '    parser: tsparser,',
    '    parserOptions: { ecmaVersion: 2022, sourceType: "module" },',
    '  },',
    '}];',
  ].join('\n');
}

function copyDirSync(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

describe('test-app integration', () => {
  beforeEach(() => {
    routeStore.reset();
  });

  it('should produce expected fossyl violations across all test-app files', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fossyl-integration-'));
    try {
      const tmpSrc = path.join(tmpDir, 'src');
      copyDirSync(testAppSrc, tmpSrc);
      fs.writeFileSync(path.join(tmpDir, 'eslint.config.cjs'), createIntegrationConfig());

      const allFiles: string[] = [];
      function collectFiles(dir: string): void {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            collectFiles(full);
          } else if (entry.name.endsWith('.ts')) {
            allFiles.push(path.relative(tmpDir, full));
          }
        }
      }
      collectFiles(tmpSrc);
      allFiles.sort((a, b) => {
        const aIsFeat = a.startsWith('src/features/');
        const bIsFeat = b.startsWith('src/features/');
        if (aIsFeat && !bIsFeat) return -1;
        if (!aIsFeat && bIsFeat) return 1;
        return a.localeCompare(b);
      });

      const eslint = new ESLint({ cwd: tmpDir });
      const results = await eslint.lintFiles(allFiles);

      const violations: Record<string, string[]> = {};
      for (const result of results) {
        const relPath = path.relative(tmpSrc, result.filePath);
        violations[relPath] = result.messages
          .filter((m) => m.ruleId && m.ruleId.startsWith('fossyl/'))
          .map((m) => m.ruleId!);
      }

      const expected: Record<string, number> = {
        // Valid files (zero fossyl violations expected)
        'features/todos/repo/todos.repo.ts': 0,
        'features/todos/routes/todos.route.ts': 0,
        'features/todos/services/todos.service.ts': 0,
        'features/users/repo/users.repo.ts': 0,
        'features/users/routes/users.route.ts': 0,
        'features/users/services/users.service.ts': 0,
        'features/users/validators/users.validators.ts': 0,
        'auth.ts': 0,
        'index.ts': 1,
        // Violation files
        'violations/duplicate-routes.ts': 2,
        'violations/mixed-prefixes.route.ts': 3,
        'violations/no-prefix.route.ts': 3,
        'violations/plain-file-imports-repo.ts': 2,
        'violations/route-imports-repo.ts': 2,
        'violations/things.route.ts': 1,
        'violations/things.service.ts': 1,
        'violations/validator-imports-repo.ts': 1,
      };

      for (const [file, expectedCount] of Object.entries(expected)) {
        const actual = violations[file] ?? [];
        expect(
          actual.length,
          `Expected ${expectedCount} fossyl violations in ${file}, got ${actual.length}: [${actual.join(', ')}]`,
        ).toBe(expectedCount);
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
