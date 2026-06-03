import { ESLint } from "eslint";
import { describe, it, expect } from "vitest";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

function createESLint(tmpDir: string): ESLint {
  const pluginPath = path.join(process.cwd(), "dist", "index.cjs");
  const config = [
    'const fossyl = require("' + pluginPath.replace(/\\/g, "/") + '").default;',
    "module.exports = [{",
    '  files: ["**/*.ts"],',
    "  plugins: { fossyl },",
    '  rules: { "fossyl/no-router-chain": "error" },',
    '  languageOptions: { ecmaVersion: 2020, sourceType: "module" },',
    "}];",
  ].join("\n");
  fs.writeFileSync(path.join(tmpDir, "eslint.config.cjs"), config);
  return new ESLint({ cwd: tmpDir });
}

async function lintCode(
  code: string,
  filename: string
): Promise<ReturnType<ESLint["lintFiles"]>> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fossyl-router-"));
  try {
    fs.writeFileSync(path.join(tmpDir, filename), code);
    const eslint = createESLint(tmpDir);
    const results = await eslint.lintFiles([filename]);
    return results;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

describe("no-router-chain", () => {
  describe("createRouter standalone", () => {
    it("should allow standalone createRouter declaration", async () => {
      const [result] = await lintCode(
        'const router = createRouter("/todos");\n',
        "test.route.ts"
      );
      expect(result.messages).toHaveLength(0);
    });

    it("should allow exported standalone createRouter", async () => {
      const [result] = await lintCode(
        'export const router = createRouter("/todos");\n',
        "test.route.ts"
      );
      expect(result.messages).toHaveLength(0);
    });

    it("should flag chaining on createRouter", async () => {
      const [result] = await lintCode(
        'const router = createRouter("/todos").authenticator(auth);\n',
        "test.route.ts"
      );
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].ruleId).toBe("fossyl/no-router-chain");
    });

    it("should flag query chaining on createRouter", async () => {
      const [result] = await lintCode(
        'const router = createRouter("/todos").query(qv);\n',
        "test.route.ts"
      );
      expect(result.messages).toHaveLength(1);
    });

    it("should flag paginate chaining on createRouter", async () => {
      const [result] = await lintCode(
        'const router = createRouter("/todos").paginate({});\n',
        "test.route.ts"
      );
      expect(result.messages).toHaveLength(1);
    });

    it("should flag validator chaining on createRouter", async () => {
      const [result] = await lintCode(
        'const router = createRouter("/todos").validator(v);\n',
        "test.route.ts"
      );
      expect(result.messages).toHaveLength(1);
    });

    it("should flag full chain on createRouter", async () => {
      const [result] = await lintCode(
        'const router = createRouter("/admin").authenticator(auth).validator(v);\n',
        "test.route.ts"
      );
      expect(result.messages).toHaveLength(1);
    });
  });

  describe("createEndpoint chain termination", () => {
    it("should allow complete endpoint chain with .get", async () => {
      const [result] = await lintCode(
        'const router = createRouter("/todos");\nrouter.createEndpoint("/").get(() => ({}));\n',
        "test.route.ts"
      );
      expect(result.messages).toHaveLength(0);
    });

    it("should allow complete endpoint chain with .post and middleware", async () => {
      const [result] = await lintCode(
        'const router = createRouter("/todos");\nrouter.createEndpoint("/").authenticator(a).validator(v).post((a) => (b) => async () => ({}));\n',
        "test.route.ts"
      );
      expect(result.messages).toHaveLength(0);
    });

    it("should allow complete endpoint with .put, .query, .paginate", async () => {
      const [result] = await lintCode(
        'const router = createRouter("/todos");\nrouter.createEndpoint("/").query(qv).paginate(c).authenticator(a).put(h);\n',
        "test.route.ts"
      );
      expect(result.messages).toHaveLength(0);
    });

    it("should flag bare createEndpoint with no chain", async () => {
      const [result] = await lintCode(
        'const router = createRouter("/todos");\nrouter.createEndpoint("/");\n',
        "test.route.ts"
      );
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].ruleId).toBe("fossyl/no-router-chain");
    });

    it("should flag createEndpoint ending with authenticator", async () => {
      const [result] = await lintCode(
        'const router = createRouter("/todos");\nrouter.createEndpoint("/").authenticator(a);\n',
        "test.route.ts"
      );
      expect(result.messages).toHaveLength(1);
    });

    it("should flag createEndpoint ending with validator", async () => {
      const [result] = await lintCode(
        'const router = createRouter("/todos");\nrouter.createEndpoint("/").authenticator(a).validator(v);\n',
        "test.route.ts"
      );
      expect(result.messages).toHaveLength(1);
    });

    it("should flag createEndpoint ending with query", async () => {
      const [result] = await lintCode(
        'const router = createRouter("/todos");\nrouter.createEndpoint("/").query(qv);\n',
        "test.route.ts"
      );
      expect(result.messages).toHaveLength(1);
    });

    it("should flag createEndpoint ending with paginate", async () => {
      const [result] = await lintCode(
        'const router = createRouter("/todos");\nrouter.createEndpoint("/").paginate(c);\n',
        "test.route.ts"
      );
      expect(result.messages).toHaveLength(1);
    });

    it("should flag exported incomplete endpoint chain", async () => {
      const [result] = await lintCode(
        'const router = createRouter("/todos");\nexport const x = router.createEndpoint("/").authenticator(a);\n',
        "test.route.ts"
      );
      expect(result.messages).toHaveLength(1);
    });

    it("should flag assigned incomplete endpoint chain", async () => {
      const [result] = await lintCode(
        'const router = createRouter("/todos");\nconst x = router.createEndpoint("/").validator(v);\n',
        "test.route.ts"
      );
      expect(result.messages).toHaveLength(1);
    });
  });

  it("should not flag non-router function calls", async () => {
    const [result] = await lintCode(
      'const x = someFunction("/path").method();\n',
      "test.route.ts"
    );
    expect(result.messages).toHaveLength(0);
  });
});
