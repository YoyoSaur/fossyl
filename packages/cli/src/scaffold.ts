import * as fs from "node:fs";
import * as path from "node:path";
import { createRequire } from "node:module";
import type { ProjectOptions } from "./prompts";
import { VERSIONS } from "./versions";

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
  const pkgDir = path.dirname(require.resolve("../package.json"));
  const pkgSkillRoot = path.join(pkgDir, "dist", "skills");
  const adapters = collectSkillDirs(options);

  let skillRoot = pkgSkillRoot;
  if (!fs.existsSync(skillRoot)) {
    const monorepoRoot = path.resolve(pkgDir, "..", "..");
    skillRoot = path.join(monorepoRoot, "skills");
  }

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
          const fossylVersions: Record<string, string> = {
            "@fossyl/core": VERSIONS.core,
            "@fossyl/express": VERSIONS.express,
            "@fossyl/zod": VERSIONS.zod,
            "@fossyl/kysely": VERSIONS.kysely,
            "eslint-plugin-fossyl": VERSIONS.eslintPlugin,
            fossyl: VERSIONS.cli,
          };
          for (const dep of [pkg.dependencies, pkg.devDependencies]) {
            if (!dep) continue;
            for (const [name, version] of Object.entries(dep)) {
              if (version === "workspace:*" && name in fossylVersions) {
                dep[name] = `^${fossylVersions[name]}`;
              }
            }
          }
          content = JSON.stringify(pkg, null, 2) + "\n";
        }
        files.push({ path: relativePath, content });
      }
    }
  }

  walk(root);
  return files;
}

const GITIGNORE = `node_modules
dist
.env
.env.local
.DS_Store
*.log
`;

const CORE_SKILLS = [
  "fossyl-execute",
  "fossyl-domain",
  "fossyl-feature",
  "fossyl-route",
  "fossyl-service",
  "fossyl-repo",
  "fossyl-pagination",
  "fossyl-errors",
];

const EXPRESS_SKILLS = ["fossyl-server", "fossyl-context"];
const KYSELY_SKILLS = ["fossyl-database", "fossyl-migrations", "fossyl-add-model"];
const ZOD_SKILLS = ["fossyl-validation", "fossyl-validator-test"];

function generateOpenCodeJsonc(options: ProjectOptions): FileEntry {
  const skillPaths: string[] = [];

  skillPaths.push(
    ...CORE_SKILLS.map((skill) => `.opencode/skills/${skill}/SKILL.md`)
  );

  if (options.server === "express") {
    skillPaths.push(
      ...EXPRESS_SKILLS.map((skill) => `.opencode/skills/${skill}/SKILL.md`)
    );
  }

  if (options.database === "kysely") {
    skillPaths.push(
      ...KYSELY_SKILLS.map((skill) => `.opencode/skills/${skill}/SKILL.md`)
    );
  }

  if (options.validator === "zod") {
    skillPaths.push(
      ...ZOD_SKILLS.map((skill) => `.opencode/skills/${skill}/SKILL.md`)
    );
  }

  const skillLines = skillPaths.map((skill, index) => {
    const suffix = index < skillPaths.length - 1 ? "," : "";
    return `    "${skill}"${suffix}`;
  });

  const content = [
    "// opencode configuration — generated by fossyl",
    "{",
    '  "skills": [',
    ...skillLines,
    "  ]",
    "}",
    "",
  ].join("\n");

  return { path: "opencode.jsonc", content };
}

export function generateFiles(options: ProjectOptions): FileEntry[] {
  const exampleFiles = readExampleFiles(
    exampleDirName(options),
    options.name,
    options.docker
  );
  const skillFiles = copySkills(options);
  const gitignore: FileEntry = { path: ".gitignore", content: GITIGNORE };
  const openCodeConfig = generateOpenCodeJsonc(options);
  return [...exampleFiles, skillFiles, gitignore, openCodeConfig].flat();
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

  try {
    require("child_process").execSync("git init", { cwd: projectPath, stdio: "ignore" });
  } catch {
    // git not available — project still usable
  }
}
