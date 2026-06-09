import { ESLint } from "eslint";
import { describe, it, expect } from "vitest";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { createRequire } from "node:module";

const TIMEOUT = 30000;

const _require = createRequire(import.meta.url);
const pluginPath = path.join(process.cwd(), "dist", "index.cjs");
const parserPath = _require.resolve("@typescript-eslint/parser");

interface LintMessage {
  ruleId: string | null;
  message: string;
  line: number;
}

async function lintInDir(
  files: Record<string, string>,
  imports?: string
): Promise<Record<string, { messages: LintMessage[] }>> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fossyl-throw-"));
  try {
    const tsconfigPath = path.join(tmpDir, "tsconfig.json");
    fs.writeFileSync(
      tsconfigPath,
      JSON.stringify({
        compilerOptions: {
          target: "ES2020",
          module: "commonjs",
          moduleResolution: "node",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
        },
        include: ["."],
        exclude: ["node_modules"],
      })
    );

    const fossylTypesDir = path.join(tmpDir, "node_modules", "@fossyl", "core");
    fs.mkdirSync(fossylTypesDir, { recursive: true });
    fs.writeFileSync(
      path.join(fossylTypesDir, "index.d.ts"),
      [
        "type FossylStatusCode = 400 | 401 | 403 | 404 | 409 | 422 | 500;",
        "type FossylError<Code extends FossylStatusCode = FossylStatusCode> = {",
        "  readonly __fossyl: true;",
        "  readonly httpStatus: Code;",
        "  readonly code: string;",
        "  readonly message: string;",
        "  readonly details?: unknown;",
        "};",
        "export function fossylError<Code extends FossylStatusCode>(",
        "  status: Code, message?: string, details?: unknown",
        "): FossylError<Code>;",
        "export function   fossylBadRequest(message?: string, details?: unknown): FossylError<400>;",
        "export function fossylUnauthorized(message?: string, details?: unknown): FossylError<401>;",
        "export function fossylForbidden(message?: string, details?: unknown): FossylError<403>;",
        "export function fossylNotFound(message?: string, details?: unknown): FossylError<404>;",
        "export function fossylConflict(message?: string, details?: unknown): FossylError<409>;",
        "export function fossylValidationError(message?: string, details?: unknown): FossylError<422>;",
        "export function fossylInternal(message?: string, details?: unknown): FossylError<500>;",
        "export type { FossylError, FossylStatusCode };",
      ].join("\n")
    );

    for (const [name, code] of Object.entries(files)) {
      const dir = path.dirname(path.join(tmpDir, name));
      fs.mkdirSync(dir, { recursive: true });
      const full = imports ? imports + "\n" + code : code;
      fs.writeFileSync(path.join(tmpDir, name), full);
    }

    const configLines = [
      'const fossyl = require("' + pluginPath.replace(/\\/g, "/") + '").default;',
      'const tsparser = require("' + parserPath.replace(/\\/g, "/") + '");',
      "module.exports = [{",
      '  files: ["**/*.ts"],',
      "  plugins: { fossyl },",
      '  rules: { "fossyl/no-bare-throw": "error" },',
      "  languageOptions: {",
      "    parser: tsparser,",
      "    parserOptions: {",
      '      ecmaVersion: 2022,',
      '      sourceType: "module",',
      '      project: "' + tsconfigPath.replace(/\\/g, "/") + '",',
      "    },",
      "  },",
      "}];",
    ];
    fs.writeFileSync(path.join(tmpDir, "eslint.config.cjs"), configLines.join("\n"));

    const eslint = new ESLint({ cwd: tmpDir });
    const results = await eslint.lintFiles(Object.keys(files));
    const output: Record<string, { messages: LintMessage[] }> = {};
    for (const result of results) {
      const name = path.basename(result.filePath);
      output[name] = {
        messages: result.messages.map((m) => ({
          ruleId: m.ruleId,
          message: m.message,
          line: m.line ?? 0,
        })),
      };
    }
    return output;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

const IMPORTS = `import { fossylError, fossylNotFound, fossylValidationError, fossylBadRequest, fossylUnauthorized } from "@fossyl/core";`;

describe("no-bare-throw", () => {
  it("should allow fossylNotFound in handler", async () => {
    const results = await lintInDir({
      "user.route.ts": `
declare const router: { get: (o: { handler: () => void }) => void };
router.get({ handler: () => { throw fossylNotFound("not found"); } });`,
    }, IMPORTS);
    expect(results["user.route.ts"].messages).toHaveLength(0);
  }, TIMEOUT);

  it("should allow fossylValidationError in handler", async () => {
    const results = await lintInDir({
      "user.route.ts": `
declare const router: { post: (o: { handler: () => void }) => void };
router.post({ handler: () => { throw fossylValidationError("invalid", {}); } });`,
    }, IMPORTS);
    expect(results["user.route.ts"].messages).toHaveLength(0);
  }, TIMEOUT);

  it("should allow fossylError in handler", async () => {
    const results = await lintInDir({
      "user.route.ts": `
declare const router: { get: (o: { handler: () => void }) => void };
router.get({ handler: () => { throw fossylError(404, "not found"); } });`,
    }, IMPORTS);
    expect(results["user.route.ts"].messages).toHaveLength(0);
  }, TIMEOUT);

  it("should allow fossylUnauthorized inside authenticator", async () => {
    const results = await lintInDir({
      "user.route.ts": `
declare const router: { get: (o: { authenticator: () => void }) => void };
router.get({ authenticator: () => { throw fossylUnauthorized("bad token"); } });`,
    }, IMPORTS);
    expect(results["user.route.ts"].messages).toHaveLength(0);
  }, TIMEOUT);

  it("should flag bare throw string in handler", async () => {
    const results = await lintInDir({
      "user.route.ts": `
declare const router: { get: (o: { handler: () => void }) => void };
router.get({ handler: () => { throw "not found"; } });`,
    }, IMPORTS);
    expect(results["user.route.ts"].messages).toHaveLength(1);
    expect(results["user.route.ts"].messages[0].ruleId).toBe("fossyl/no-bare-throw");
  }, TIMEOUT);

  it("should flag bare throw new Error in handler", async () => {
    const results = await lintInDir({
      "user.route.ts": `
declare const router: { get: (o: { handler: () => void }) => void };
router.get({ handler: () => { throw new Error("fail"); } });`,
    }, IMPORTS);
    expect(results["user.route.ts"].messages).toHaveLength(1);
    expect(results["user.route.ts"].messages[0].ruleId).toBe("fossyl/no-bare-throw");
  }, TIMEOUT);

  it("should flag bare throw object in handler", async () => {
    const results = await lintInDir({
      "user.route.ts": `
declare const router: { post: (o: { handler: () => void }) => void };
router.post({ handler: () => { throw { code: 404 }; } });`,
    }, IMPORTS);
    expect(results["user.route.ts"].messages).toHaveLength(1);
    expect(results["user.route.ts"].messages[0].ruleId).toBe("fossyl/no-bare-throw");
  }, TIMEOUT);

  it("should allow throw outside handler scope", async () => {
    const results = await lintInDir({
      "utils.ts": `function helper() { throw new Error("utility error"); }`,
    });
    expect(results["utils.ts"].messages).toHaveLength(0);
  }, TIMEOUT);

  it("should flag bare throw inside async arrow handler in .post", async () => {
    const results = await lintInDir({
      "user.route.ts": `
declare const router: { post: (o: { handler: () => void }) => void };
router.post({ handler: async () => { throw "fail"; } });`,
    }, IMPORTS);
    expect(results["user.route.ts"].messages).toHaveLength(1);
  }, TIMEOUT);

  it("should allow throw with fossylError assigned to variable", async () => {
    const results = await lintInDir({
      "user.route.ts": `
declare const router: { get: (o: { handler: () => void }) => void };
router.get({ handler: () => { const err = fossylNotFound("msg"); throw err; } });`,
    }, IMPORTS);
    expect(results["user.route.ts"].messages).toHaveLength(0);
  }, TIMEOUT);

  describe("service and repo files", () => {
    it("should allow fossyl-branded throw in service file", async () => {
      const results = await lintInDir({
        "user.service.ts": `export function fn() { throw fossylNotFound("msg"); }`,
      }, IMPORTS);
      expect(results["user.service.ts"].messages).toHaveLength(0);
    }, TIMEOUT);

    it("should flag bare throw in service file", async () => {
      const results = await lintInDir({
        "user.service.ts": `export function fn() { throw new Error("fail"); }`,
      }, IMPORTS);
      expect(results["user.service.ts"].messages).toHaveLength(1);
      expect(results["user.service.ts"].messages[0].ruleId).toBe("fossyl/no-bare-throw");
    }, TIMEOUT);

    it("should flag bare throw string in service file", async () => {
      const results = await lintInDir({
        "user.service.ts": `export function fn() { throw "bad"; }`,
      }, IMPORTS);
      expect(results["user.service.ts"].messages).toHaveLength(1);
    }, TIMEOUT);

    it("should allow fossyl-branded throw in repo file", async () => {
      const results = await lintInDir({
        "user.repo.ts": `export function fn() { throw fossylNotFound("msg"); }`,
      }, IMPORTS);
      expect(results["user.repo.ts"].messages).toHaveLength(0);
    }, TIMEOUT);

    it("should flag bare throw in repo file", async () => {
      const results = await lintInDir({
        "user.repo.ts": `export function fn() { throw new Error("fail"); }`,
      }, IMPORTS);
      expect(results["user.repo.ts"].messages).toHaveLength(1);
    }, TIMEOUT);
  });
});
