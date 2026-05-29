import * as fs from "node:fs";
import * as path from "node:path";
import { createRequire } from "node:module";
import type { ProjectOptions } from "./prompts";

const DOCKER_FILES = new Set(["Dockerfile", ".dockerignore", "docker-compose.yml"]);

export interface FileEntry {
  path: string;
  content: string;
}

const require = createRequire(import.meta.url);

const SKILL_ADAPTER_MAP: Record<string, string[]> = {
  express: ["express"],
  byo: [],
};

const VALIDATOR_MAP: Record<string, string[]> = {
  zod: ["zod"],
  byo: [],
};

const DATABASE_MAP: Record<string, string[]> = {
  kysely: ["kysely"],
  byo: [],
};

function collectSkillDirs(options: ProjectOptions): string[] {
  const dirs: string[] = ["core"];
  dirs.push(...(SKILL_ADAPTER_MAP[options.server] ?? []));
  dirs.push(...(VALIDATOR_MAP[options.validator] ?? []));
  dirs.push(...(DATABASE_MAP[options.database] ?? []));
  return [...new Set(dirs)];
}

function copySkills(options: ProjectOptions): FileEntry[] {
  const files: FileEntry[] = [];
  const monorepoRoot = path.resolve(
    path.dirname(require.resolve("../../../package.json"))
  );
  const skillRoot = path.join(monorepoRoot, "skills");
  const adapters = collectSkillDirs(options);

  for (const adapter of adapters) {
    const adapterDir = path.join(skillRoot, adapter);
    if (!fs.existsSync(adapterDir)) continue;

    const skillDirs = fs.readdirSync(adapterDir, { withFileTypes: true });
    for (const entry of skillDirs) {
      if (!entry.isDirectory()) continue;
      const skillPath = path.join(adapterDir, entry.name, "SKILL.md");
      if (!fs.existsSync(skillPath)) continue;

      const content = fs.readFileSync(skillPath, "utf-8");
      files.push({
        path: `.opencode/skills/${entry.name}/SKILL.md`,
        content,
      });
    }
  }

  return files;
}

function exampleDirName(options: ProjectOptions): string {
  return `examples/${options.server}-${options.validator}-${options.database}`;
}

function readExampleFiles(exampleDir: string, projectName: string, includeDocker: boolean): FileEntry[] {
  const files: FileEntry[] = [];
  const root = path.join(path.dirname(require.resolve("../package.json")), exampleDir);

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.name === "node_modules") continue;
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        const relativePath = path.relative(root, fullPath);
        if (!includeDocker && DOCKER_FILES.has(relativePath)) continue;
        let content = fs.readFileSync(fullPath, "utf-8");
        if (relativePath === "package.json") {
          const pkg = JSON.parse(content);
          pkg.name = projectName;
          content = JSON.stringify(pkg, null, 2) + "\n";
        }
        files.push({ path: relativePath, content });
      }
    }
  }

  walk(root);
  return files;
}

export function generateFiles(options: ProjectOptions): FileEntry[] {
  const exampleFiles = readExampleFiles(
    exampleDirName(options),
    options.name,
    options.docker
  );
  const skillFiles = copySkills(options);
  return [...exampleFiles, ...skillFiles];
}

export function writeFiles(projectPath: string, files: FileEntry[]): void {
  for (const file of files) {
    const fullPath = path.join(projectPath, file.path);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, file.content, "utf-8");
  }
}
