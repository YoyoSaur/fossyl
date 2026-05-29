import { describe, it, expect } from "vitest";
import { generateFiles } from "../src/scaffold";
import type { ProjectOptions } from "../src/prompts";

const defaultOptions: ProjectOptions = {
  name: "test-project",
  server: "express",
  validator: "zod",
  database: "kysely",
  dialect: "sqlite",
  docker: true,
};

describe("scaffold", () => {
  it("generates correct file list for default options", () => {
    const files = generateFiles(defaultOptions);

    const paths = files.map((f) => f.path);
    expect(paths).toContain("package.json");
    expect(paths).toContain("tsconfig.json");
    expect(paths).toContain("src/index.ts");
    expect(paths).toContain("src/db.ts");
    expect(paths).toContain("src/auth.ts");
    expect(paths).toContain("src/migrate.ts");
    expect(paths).toContain("src/types/db.ts");
    expect(paths).toContain("src/migrations/index.ts");
    expect(paths).toContain("src/migrations/001_create_ping.ts");
    expect(paths).toContain("src/features/ping/routes/ping.route.ts");
    expect(paths).toContain("src/features/ping/services/ping.service.ts");
    expect(paths).toContain("src/features/ping/repo/ping.repo.ts");
    expect(paths).toContain("src/features/ping/validators/ping.validators.ts");
    expect(paths).toContain(".env.example");
    expect(paths).toContain("CLAUDE.md");
    expect(paths).toContain("eslint.config.js");
    expect(paths).toContain("Dockerfile");
    expect(paths).toContain(".dockerignore");
    expect(paths).toContain("docker-compose.yml");
    expect(paths).toContain("src/features/ping/validators/ping.validators.test.ts");
    expect(files.length).toBe(20);
  });

  it("substitutes project name in package.json", () => {
    const files = generateFiles(defaultOptions);
    const pkg = files.find((f) => f.path === "package.json")!;
    const content = JSON.parse(pkg.content);
    expect(content.name).toBe("test-project");
  });

  it("excludes docker files when docker is false", () => {
    const files = generateFiles({ ...defaultOptions, docker: false });
    const paths = files.map((f) => f.path);
    expect(paths).not.toContain("Dockerfile");
    expect(paths).not.toContain(".dockerignore");
    expect(paths).not.toContain("docker-compose.yml");
  });

  it("generates correct files for non-default options", () => {
    const files = generateFiles({ ...defaultOptions, validator: "byo", database: "byo" });
    const paths = files.map((f) => f.path);
    expect(paths).toContain("src/db.ts");
    expect(paths).toContain("src/features/ping/validators/ping.validators.ts");
    // BYO validator placeholders
    const valContent = files.find((f) => f.path === "src/features/ping/validators/ping.validators.ts")!.content;
    expect(valContent).toContain("TODO");
  });
});
