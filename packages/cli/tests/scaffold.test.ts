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
    expect(paths).toContain("src/features/ping/ping.route.ts");
    expect(paths).toContain("src/features/ping/ping.service.ts");
    expect(paths).toContain("src/features/ping/ping.repo.ts");
    expect(paths).toContain("src/features/ping/ping.validators.ts");
    expect(paths).toContain(".env.example");
    expect(paths).toContain("CLAUDE.md");
    expect(paths).toContain("eslint.config.js");
    expect(paths).toContain("Dockerfile");
    expect(paths).toContain(".dockerignore");
    expect(paths).toContain("docker-compose.yml");
    expect(paths).toContain("src/features/ping/ping.validators.test.ts");
    expect(paths).toContain("src/features/ping/ping.types.ts");
    expect(paths).toContain("src/registry.ts");
    expect(paths).toContain("opencode.jsonc");
    expect(paths).toContain(".gitignore");
    expect(files.length).toBe(41);

    // opencode.jsonc uses flat paths matching copySkills
    const opencodeConfig = files.find((f) => f.path === "opencode.jsonc")!;
    expect(opencodeConfig.content).toContain('"skills":');
    expect(opencodeConfig.content).toContain(".opencode/skills/fossyl-execute/SKILL.md");
    expect(opencodeConfig.content).toContain(".opencode/skills/fossyl-server/SKILL.md");
    expect(opencodeConfig.content).not.toContain("core/fossyl");
    expect(opencodeConfig.content).not.toContain("express/fossyl");
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
    const files = generateFiles({ ...defaultOptions, server: "byo", validator: "byo", database: "byo" });
    const paths = files.map((f) => f.path);
    expect(paths).toContain("src/db.ts");
    expect(paths).toContain("src/features/ping/ping.validators.ts");
    expect(paths).toContain("src/server.ts");
    expect(paths).not.toContain("src/migrations/index.ts");
    const valContent = files.find((f) => f.path === "src/features/ping/ping.validators.ts")!.content;
    expect(valContent).not.toContain("zodValidator");
  });

  it("uses example dir matching combo", () => {
    const expressZodKysely = generateFiles(defaultOptions);
    const byoZodKysely = generateFiles({ ...defaultOptions, server: "byo" });
    const expressByoKysely = generateFiles({ ...defaultOptions, validator: "byo" });
    const expressZodByo = generateFiles({ ...defaultOptions, database: "byo" });

    expect(expressZodKysely.some((f) => f.path === "src/db.ts" && f.content.includes("better-sqlite3"))).toBe(true);
    expect(byoZodKysely.some((f) => f.path === "src/server.ts")).toBe(true);
    expect(expressByoKysely.some((f) => f.path === "src/features/ping/ping.validators.ts" && !f.content.includes("zodValidator"))).toBe(true);
    expect(expressZodByo.some((f) => f.path === "src/db.ts" && f.content.includes("TODO"))).toBe(true);
  });
});

describe("skill files", () => {
  it("includes core skills for any adapter combo", () => {
    const files = generateFiles({
      name: "test-project",
      server: "express",
      validator: "byo",
      database: "byo",
      docker: false,
    });

    const skillFiles = files.filter((f) =>
      f.path.startsWith(".opencode/skills/")
    );
    expect(skillFiles.length).toBeGreaterThan(0);

    const skillNames = skillFiles.map((f) =>
      f.path.replace(".opencode/skills/", "").replace("/SKILL.md", "")
    );
    expect(skillNames).toContain("fossyl-execute");
    expect(skillNames).toContain("fossyl-domain");
    expect(skillNames).toContain("fossyl-route");
  });

  it("includes adapter-specific skills when selected", () => {
    const files = generateFiles({
      name: "test-project",
      server: "express",
      validator: "zod",
      database: "kysely",
      docker: false,
    });

    const skillFiles = files.filter((f) =>
      f.path.startsWith(".opencode/skills/")
    );
    const skillNames = skillFiles.map((f) =>
      f.path.replace(".opencode/skills/", "").replace("/SKILL.md", "")
    );

    expect(skillNames).toContain("fossyl-server");
    expect(skillNames).toContain("fossyl-validation");
    expect(skillNames).toContain("fossyl-add-model");
  });
});
