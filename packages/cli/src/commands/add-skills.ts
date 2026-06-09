import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { createRequire } from "node:module";
import * as yaml from "js-yaml";

const require = createRequire(import.meta.url);

const ADAPTER_CATEGORIES = ["express", "kysely", "zod"] as const;
type AdapterCategory = (typeof ADAPTER_CATEGORIES)[number];

function isAdapterCategory(v: string): v is AdapterCategory {
  return ADAPTER_CATEGORIES.includes(v as AdapterCategory);
}

function resolveProjectRoot(): string {
  return process.cwd();
}

function detectAdapters(pkgPath: string): AdapterCategory[] {
  if (!existsSync(pkgPath)) return [];

  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  const adapters: AdapterCategory[] = [];
  if (allDeps["@fossyl/express"]) adapters.push("express");
  if (allDeps["@fossyl/kysely"]) adapters.push("kysely");
  if (allDeps["@fossyl/zod"]) adapters.push("zod");
  return adapters;
}

function resolveSkillsDir(): string | null {
  // Published: bundled alongside dist/
  const distSkills = join(dirname(require.resolve("../package.json")), "dist", "skills");
  if (existsSync(distSkills)) return distSkills;

  // Dev monorepo: CLI package root
  const localSkills = join(dirname(require.resolve("../package.json")), "skills");
  if (existsSync(localSkills)) return localSkills;

  // Dev monorepo fallback: root skills/
  const rootSkills = join(dirname(require.resolve("../../../package.json")), "skills");
  if (existsSync(rootSkills)) return rootSkills;

  return null;
}

function resolveAgentSourceYaml(): string | null {
  // Published: bundled alongside dist/
  const distYaml = join(dirname(require.resolve("../package.json")), "dist", "agent-source.yaml");
  if (existsSync(distYaml)) return distYaml;

  // Dev monorepo: for-the-devs/
  const forTheDevs = join(
    dirname(require.resolve("../../../package.json")),
    "for-the-devs",
    "agent-source.yaml"
  );
  if (existsSync(forTheDevs)) return forTheDevs;

  return null;
}

function listCategorySkills(skillsDir: string, category: string): string[] {
  const categoryDir = join(skillsDir, category);
  if (!existsSync(categoryDir)) return [];

  return readdirSync(categoryDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

function renderList(skillsDir: string, adapters: AdapterCategory[]): void {
  const core = listCategorySkills(skillsDir, "core");
  console.log("\nCore (always included):");
  for (const s of core) console.log(`  ${s}`);

  const available = ADAPTER_CATEGORIES.filter((a) =>
    existsSync(join(skillsDir, a))
  );

  for (const adapter of available) {
    const skills = listCategorySkills(skillsDir, adapter);
    const detected = adapters.includes(adapter);
    const status = detected ? "" : " (not detected — use --adapter to include)";
    console.log(`\n${adapter}${status}:`);
    for (const s of skills) console.log(`  ${s}`);
  }
  console.log();
}

function installSkills(
  skillsDir: string,
  adapters: AdapterCategory[],
  targetDir: string
): void {
  const allCategories = ["core", ...adapters];

  // Clear existing fossyl skills
  if (existsSync(targetDir)) {
    const existing = readdirSync(targetDir);
    for (const entry of existing) {
      if (entry.startsWith("fossyl-")) {
        try {
          rmSync(join(targetDir, entry), { recursive: true, force: true });
        } catch {
          // ignore
        }
      }
    }
  }

  let copied = 0;
  for (const category of allCategories) {
    const categoryDir = join(skillsDir, category);
    if (!existsSync(categoryDir)) continue;

    const skillDirs = readdirSync(categoryDir, { withFileTypes: true });
    for (const entry of skillDirs) {
      if (!entry.isDirectory()) continue;
      const skillPath = join(categoryDir, entry.name, "SKILL.md");
      if (!existsSync(skillPath)) continue;

      const targetSkillDir = join(targetDir, entry.name);
      mkdirSync(targetSkillDir, { recursive: true });
      writeFileSync(
        join(targetSkillDir, "SKILL.md"),
        readFileSync(skillPath, "utf-8")
      );
      copied++;
    }
  }

  console.log(`Copied ${copied} skills to ${targetDir}`);
}

async function generateAgentReference(
  adapters: AdapterCategory[],
  targetDir: string
): Promise<void> {
  const yamlPath = resolveAgentSourceYaml();
  if (!yamlPath) {
    console.warn("Warning: agent-source.yaml not found, skipping reference generation");
    return;
  }

  const doc = yaml.load(readFileSync(yamlPath, "utf-8")) as {
    exports?: Array<{
      name: string;
      package: string;
      description: string;
      agents: string;
    }>;
    patterns?: Array<{
      id: string;
      packages?: string[];
      description: string;
      agents: string;
    }>;
  };

  const activePackages = new Set(["core", ...adapters]);

  let md = "# Fossyl Agent Reference\n\n";

  const exportEntries = (doc.exports ?? []).filter(
    (e) => activePackages.has(e.package)
  );

  const patternEntries = (doc.patterns ?? []).filter(
    (p) => !p.packages || p.packages.some((pkg) => activePackages.has(pkg))
  );

  if (exportEntries.length > 0) {
    md += "## API Reference\n\n";
    const byPackage = new Map<string, typeof exportEntries>();
    for (const e of exportEntries) {
      const list = byPackage.get(e.package) ?? [];
      list.push(e);
      byPackage.set(e.package, list);
    }

    for (const [pkg, entries] of byPackage) {
      md += `### @fossyl/${pkg}\n\n`;
      for (const e of entries) {
        md += `#### ${e.name}\n\n`;
        if (e.description) md += `${e.description}\n\n`;
        if (e.agents) md += `${e.agents}\n\n`;
      }
    }
  }

  if (patternEntries.length > 0) {
    md += "## Patterns\n\n";
    for (const p of patternEntries) {
      md += `### ${p.id}\n\n`;
      if (p.description) md += `${p.description}\n\n`;
      if (p.agents) md += `${p.agents}\n\n`;
    }
  }

  const refPath = join(targetDir, "..", "AGENTS.md");
  writeFileSync(refPath, md);
  console.log(`Generated agent reference: ${refPath}`);
}

export interface AddSkillsArgs {
  adapters?: string[];
  list?: boolean;
}

export async function addSkillsCommand(args: AddSkillsArgs): Promise<void> {
  const projectRoot = resolveProjectRoot();
  const pkgPath = join(projectRoot, "package.json");
  const skillsDir = resolveSkillsDir();

  if (!skillsDir) {
    console.error("Error: Could not find fossyl skills directory");
    process.exit(1);
  }

  const detected = detectAdapters(pkgPath);
  const adapters: AdapterCategory[] =
    args.adapters?.filter((a): a is AdapterCategory => isAdapterCategory(a)) ??
    detected;

  if (args.list) {
    renderList(skillsDir, detected);
    return;
  }

  const targetDir = join(projectRoot, ".opencode", "skills");
  mkdirSync(targetDir, { recursive: true });

  // Check for fossyl dependency
  const pkg = existsSync(pkgPath)
    ? JSON.parse(readFileSync(pkgPath, "utf-8"))
    : {};
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const hasFossyl = Object.keys(allDeps).some(
    (d) => d === "fossyl" || d.startsWith("@fossyl/")
  );
  if (!hasFossyl) {
    console.warn(
      "Warning: No fossyl dependency found in package.json. Skills may not match your framework version."
    );
  }

  installSkills(skillsDir, adapters, targetDir);
  await generateAgentReference(adapters, targetDir);
}
