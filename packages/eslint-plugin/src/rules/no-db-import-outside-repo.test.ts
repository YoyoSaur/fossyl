import { ESLint } from "eslint";
import { describe, it, expect } from "vitest";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

function createESLint(
  tmpDir: string,
  ruleConfig: unknown[] = ["error"]
): ESLint {
  const pluginPath = path.join(process.cwd(), "dist", "index.cjs");
  const config = [
    'const fossyl = require("' + pluginPath.replace(/\\/g, "/") + '").default;',
    "module.exports = [{",
    '  files: ["**/*.ts"],',
    "  plugins: { fossyl },",
    '  rules: { "fossyl/no-db-import-outside-repo": ' + JSON.stringify(ruleConfig) + " },",
    '  languageOptions: { ecmaVersion: 2020, sourceType: "module" },',
    "}];",
  ].join("\n");
  fs.writeFileSync(path.join(tmpDir, "eslint.config.cjs"), config);
  return new ESLint({ cwd: tmpDir });
}

async function lintCode(
  code: string,
  filename: string,
  ruleConfig?: unknown[]
): Promise<ReturnType<ESLint["lintFiles"]>> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fossyl-db-"));
  try {
    fs.writeFileSync(path.join(tmpDir, filename), code);
    const eslint = createESLint(tmpDir, ruleConfig);
    const results = await eslint.lintFiles([filename]);
    return results;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

describe("no-db-import-outside-repo", () => {
  describe("@db alias", () => {
    it("should allow db import in repo file", async () => {
      const [result] = await lintCode(
        'import { db } from "@db";\n',
        "todos.repo.ts"
      );
      expect(result.messages).toHaveLength(0);
    });

    it("should flag db import in service file", async () => {
      const [result] = await lintCode(
        'import { db } from "@db";\n',
        "todos.service.ts"
      );
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].ruleId).toBe("fossyl/no-db-import-outside-repo");
    });

    it("should flag db import in route file", async () => {
      const [result] = await lintCode(
        'import { db } from "@db";\n',
        "todos.route.ts"
      );
      expect(result.messages).toHaveLength(1);
    });

    it("should flag db import in validator file", async () => {
      const [result] = await lintCode(
        'import { db } from "@db";\n',
        "todos.validator.ts"
      );
      expect(result.messages).toHaveLength(1);
    });
  });

  describe("relative path ./db", () => {
    it("should allow db import in repo file", async () => {
      const [result] = await lintCode(
        'import { db } from "../../../db";\n',
        "todos.repo.ts"
      );
      expect(result.messages).toHaveLength(0);
    });

    it("should flag db import in service file", async () => {
      const [result] = await lintCode(
        'import { db } from "../../db";\n',
        "todos.service.ts"
      );
      expect(result.messages).toHaveLength(1);
    });

    it("should flag db import with .ts extension", async () => {
      const [result] = await lintCode(
        'import { db } from "./db.ts";\n',
        "todos.service.ts"
      );
      expect(result.messages).toHaveLength(1);
    });
  });

  describe("other import forms", () => {
    it("should allow non-db imports in any file", async () => {
      const [result] = await lintCode(
        'import { z } from "zod";\n',
        "todos.service.ts"
      );
      expect(result.messages).toHaveLength(0);
    });

    it("should flag namespace import from db", async () => {
      const [result] = await lintCode(
        'import * as db from "@db";\n',
        "todos.service.ts"
      );
      expect(result.messages).toHaveLength(1);
    });

    it("should flag default import from db", async () => {
      const [result] = await lintCode(
        'import db from "../../db";\n',
        "todos.service.ts"
      );
      expect(result.messages).toHaveLength(1);
    });
  });

  describe("allowFiles option", () => {
    it("should allow db import in files matching allowFiles", async () => {
      const result = (
        await lintCode(
          'import { db } from "@db";\n',
          "index.ts",
          ["error", { allowFiles: ["index.ts", "migrate.ts"] }]
        )
      )[0];
      expect(result.messages).toHaveLength(0);
    });

    it("should still flag db import in non-allowed files", async () => {
      const result = (
        await lintCode(
          'import { db } from "@db";\n',
          "some-file.ts",
          ["error", { allowFiles: ["index.ts"] }]
        )
      )[0];
      expect(result.messages).toHaveLength(1);
    });
  });
});
