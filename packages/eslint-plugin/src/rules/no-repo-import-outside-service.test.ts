import { ESLint } from 'eslint';
import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

function createESLint(tmpDir: string): ESLint {
  const pluginPath = path.join(process.cwd(), 'dist', 'index.cjs');
  const config = [
    'const fossyl = require("' + pluginPath.replace(/\\/g, '/') + '").default;',
    'module.exports = [{',
    '  files: ["**/*.ts"],',
    '  plugins: { fossyl },',
    '  rules: { "fossyl/no-repo-import-outside-service": "error" },',
    '  languageOptions: { ecmaVersion: 2020, sourceType: "module" },',
    '}];',
  ].join('\n');
  fs.writeFileSync(path.join(tmpDir, 'eslint.config.cjs'), config);
  return new ESLint({ cwd: tmpDir });
}

async function lintCode(code: string, filename: string): Promise<ReturnType<ESLint['lintFiles']>> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fossyl-test-'));
  try {
    fs.writeFileSync(path.join(tmpDir, filename), code);
    const eslint = createESLint(tmpDir);
    const results = await eslint.lintFiles([filename]);
    return results;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

describe('no-repo-import-outside-service', () => {
  it('should allow repo import in service files', async () => {
    const [result] = await lintCode(
      'import { repo } from "./repo/user.repo";\n',
      'user.service.ts',
    );
    expect(result.messages).toHaveLength(0);
  });

  it('should allow non-repo import in any file', async () => {
    const [result] = await lintCode('import { z } from "zod";\n', 'user.route.ts');
    expect(result.messages).toHaveLength(0);
  });

  it('should allow service import in route file', async () => {
    const [result] = await lintCode(
      'import { svc } from "./services/user.service";\n',
      'user.route.ts',
    );
    expect(result.messages).toHaveLength(0);
  });

  it('should allow re-export from repo in service file', async () => {
    const [result] = await lintCode(
      'export { repo } from "./repo/index.repo";\n',
      'index.service.ts',
    );
    expect(result.messages).toHaveLength(0);
  });

  it('should flag cross-boundary repo import in service file', async () => {
    const [result] = await lintCode(
      'import { repo } from "./repo/user.repo";\n',
      'things.service.ts',
    );
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].ruleId).toBe('fossyl/no-repo-import-outside-service');
    expect(result.messages[0].messageId).toBe('crossBoundaryRepoImport');
  });

  it('should flag repo import in route file', async () => {
    const [result] = await lintCode(
      'import { repo } from "./repo/user.repo";\n',
      'user.route.ts',
    );
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].ruleId).toBe('fossyl/no-repo-import-outside-service');
  });

  it('should flag repo import with .ts extension in validator file', async () => {
    const [result] = await lintCode(
      'import { repo } from "./repo/user.repo.ts";\n',
      'user.validator.ts',
    );
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].ruleId).toBe('fossyl/no-repo-import-outside-service');
  });

  it('should flag repo re-export in non-service file', async () => {
    const [result] = await lintCode(
      'export { repo } from "./repo/user.repo";\n',
      'index.ts',
    );
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].ruleId).toBe('fossyl/no-repo-import-outside-service');
  });

  it('should flag export * from repo in non-service file', async () => {
    const [result] = await lintCode(
      'export * from "./repo/user.repo";\n',
      'index.ts',
    );
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].ruleId).toBe('fossyl/no-repo-import-outside-service');
  });
});
