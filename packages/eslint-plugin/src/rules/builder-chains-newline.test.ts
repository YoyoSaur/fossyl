import { ESLint } from "eslint";
import { describe, it, expect } from "vitest";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { createRequire } from "node:module";

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
  ruleConfig: unknown[] = ["error", { builderTypes: ["MyBuilder"] }],
  fix = false
): Promise<Record<string, { messages: LintMessage[]; output?: string }>> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fossyl-builder-"));
  try {
    // Write a minimal tsconfig for type-aware linting
    // Use include with an explicit relative pattern that matches any .ts file
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

    for (const [name, code] of Object.entries(files)) {
      const dir = path.dirname(path.join(tmpDir, name));
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(tmpDir, name), code);
    }

    const configLines = [
      'const fossyl = require("' + pluginPath.replace(/\\/g, "/") + '").default;',
      'const tsparser = require("' + parserPath.replace(/\\/g, "/") + '");',
      "module.exports = [{",
      '  files: ["**/*.ts"],',
      "  plugins: { fossyl },",
      '  rules: { "fossyl/builder-chains-newline": ' + JSON.stringify(ruleConfig) + " },",
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

    const eslint = new ESLint({ cwd: tmpDir, fix });
    const results = await eslint.lintFiles(Object.keys(files));
    const output: Record<string, { messages: LintMessage[]; output?: string }> = {};
    for (const result of results) {
      const name = path.basename(result.filePath);
      output[name] = {
        messages: result.messages.map((m) => ({
          ruleId: m.ruleId,
          message: m.message,
          line: m.line ?? 0,
        })),
        output: result.output,
      };
    }
    return output;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

describe("builder-chains-newline", () => {
  describe("valid cases", () => {
    it("should allow a single method call (no chain)", async () => {
      const results = await lintInDir({
        "test.ts":
          "class MyBuilder { get(handler: any): any { return handler; } }\n" +
          "const builder = new MyBuilder();\n" +
          "builder.get(async () => ({}));\n",
      });
      expect(results["test.ts"].messages).toHaveLength(0);
    });

    it("should allow multi-call chains already on separate lines", async () => {
      const results = await lintInDir({
        "test.ts":
          "class MyBuilder {\n" +
          "  a(): MyBuilder { return this; }\n" +
          "  b(): MyBuilder { return this; }\n" +
          "}\n" +
          "const builder = new MyBuilder();\n" +
          "builder\n" +
          "  .a()\n" +
          "  .b();\n",
      });
      expect(results["test.ts"].messages).toHaveLength(0);
    });

    it("should allow three calls all on separate lines", async () => {
      const results = await lintInDir({
        "test.ts":
          "class MyBuilder {\n" +
          "  a(): MyBuilder { return this; }\n" +
          "  b(): MyBuilder { return this; }\n" +
          "  c(): MyBuilder { return this; }\n" +
          "}\n" +
          "const builder = new MyBuilder();\n" +
          "builder\n" +
          "  .a()\n" +
          "  .b()\n" +
          "  .c();\n",
      });
      expect(results["test.ts"].messages).toHaveLength(0);
    });

    it("should not flag chains on non-builder types", async () => {
      const results = await lintInDir({
        "test.ts":
          "class OtherType {\n" +
          "  a(): OtherType { return this; }\n" +
          "  b(): OtherType { return this; }\n" +
          "}\n" +
          "const x = new OtherType();\n" +
          "x.a().b();\n",
      });
      const errors = results["test.ts"].messages.filter(
        (m) => m.ruleId === "fossyl/builder-chains-newline"
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe("invalid cases", () => {
    it("should flag two calls on the same line", async () => {
      const results = await lintInDir({
        "test.ts":
          "class MyBuilder {\n" +
          "  a(): MyBuilder { return this; }\n" +
          "  b(): MyBuilder { return this; }\n" +
          "}\n" +
          "const builder = new MyBuilder();\n" +
          "builder.a().b();\n",
      });
      const errors = results["test.ts"].messages.filter(
        (m) => m.ruleId === "fossyl/builder-chains-newline"
      );
      expect(errors).toHaveLength(2);
      expect(errors[0].message).toContain("MyBuilder");
    });

    it("should flag three calls all on the same line", async () => {
      const results = await lintInDir({
        "test.ts":
          "class MyBuilder {\n" +
          "  a(): MyBuilder { return this; }\n" +
          "  b(): MyBuilder { return this; }\n" +
          "  c(): MyBuilder { return this; }\n" +
          "}\n" +
          "const builder = new MyBuilder();\n" +
          "builder.a().b().c();\n",
      });
      const errors = results["test.ts"].messages.filter(
        (m) => m.ruleId === "fossyl/builder-chains-newline"
      );
      expect(errors).toHaveLength(3);
    });

    it("should flag only the calls on the same line when some are separated", async () => {
      const results = await lintInDir({
        "test.ts":
          "class MyBuilder {\n" +
          "  a(): MyBuilder { return this; }\n" +
          "  b(): MyBuilder { return this; }\n" +
          "  c(): MyBuilder { return this; }\n" +
          "}\n" +
          "const builder = new MyBuilder();\n" +
          "builder.a().b()\n" +
          "  .c();\n",
      });
      const errors = results["test.ts"].messages.filter(
        (m) => m.ruleId === "fossyl/builder-chains-newline"
      );
      // .a() has builder on same line, .b() has .a() on same line — 2 errors
      // .c() is on its own line — no error
      expect(errors).toHaveLength(2);
      expect(errors[0].line).toBe(7);
      expect(errors[1].line).toBe(7);
    });
  });

  describe("custom builderTypes option", () => {
    it("should use custom builder type names from config", async () => {
      const results = await lintInDir(
        {
          "test.ts":
            "class CustomRouter {\n" +
            "  a(): CustomRouter { return this; }\n" +
            "  b(): CustomRouter { return this; }\n" +
            "}\n" +
            "const r = new CustomRouter();\n" +
            "r.a().b();\n",
        },
        ["error", { builderTypes: ["CustomRouter"] }]
      );
      const errors = results["test.ts"].messages.filter(
        (m) => m.ruleId === "fossyl/builder-chains-newline"
      );
      expect(errors).toHaveLength(2);
      expect(errors[0].message).toContain("CustomRouter");
    });

    it("should not flag types not in builderTypes list", async () => {
      const results = await lintInDir(
        {
          "test.ts":
            "class NotListed {\n" +
            "  a(): NotListed { return this; }\n" +
            "  b(): NotListed { return this; }\n" +
            "  c(): NotListed { return this; }\n" +
            "}\n" +
            "const r = new NotListed();\n" +
            "r.a().b();\n",
        },
        ["error", { builderTypes: ["SomethingElse"] }]
      );
      const errors = results["test.ts"].messages.filter(
        (m) => m.ruleId === "fossyl/builder-chains-newline"
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe("fixer", () => {
    it("should insert newlines between chain calls", async () => {
      const results = await lintInDir(
        {
          "test.ts":
            "class MyBuilder {\n" +
            "  a(): MyBuilder { return this; }\n" +
            "  b(): MyBuilder { return this; }\n" +
            "}\n" +
            "const builder = new MyBuilder();\n" +
            "builder.a().b();\n",
        },
        ["error", { builderTypes: ["MyBuilder"] }],
        true
      );
      expect(results["test.ts"].output).toBe(
        "class MyBuilder {\n" +
          "  a(): MyBuilder { return this; }\n" +
          "  b(): MyBuilder { return this; }\n" +
          "}\n" +
          "const builder = new MyBuilder();\n" +
          "builder\n" +
          "  .a()\n" +
          "  .b();\n"
      );
    });

    it("should insert newlines for three-call chains", async () => {
      const results = await lintInDir(
        {
          "test.ts":
            "class MyBuilder {\n" +
            "  a(): MyBuilder { return this; }\n" +
            "  b(): MyBuilder { return this; }\n" +
            "  c(): MyBuilder { return this; }\n" +
            "}\n" +
            "const builder = new MyBuilder();\n" +
            "builder.a().b().c();\n",
        },
        ["error", { builderTypes: ["MyBuilder"] }],
        true
      );
      expect(results["test.ts"].output).toBe(
        "class MyBuilder {\n" +
          "  a(): MyBuilder { return this; }\n" +
          "  b(): MyBuilder { return this; }\n" +
          "  c(): MyBuilder { return this; }\n" +
          "}\n" +
          "const builder = new MyBuilder();\n" +
          "builder\n" +
          "  .a()\n" +
          "  .b()\n" +
          "  .c();\n"
      );
    });
  });
});
