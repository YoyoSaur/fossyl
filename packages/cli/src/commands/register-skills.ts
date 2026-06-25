import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import os from "node:os";

export interface RegisterSkillsArgs {
  global?: boolean;
}

export async function registerSkillsCommand(args: RegisterSkillsArgs): Promise<void> {
  const targetPath = args.global
    ? join(os.homedir(), ".opencode", "opencode.json")
    : join(process.cwd(), "opencode.jsonc");

  const skillsDir = join(process.cwd(), ".opencode", "skills");

  if (!existsSync(skillsDir)) {
    console.error("Error: .opencode/skills/ directory not found. Run `fossyl add-skills` first.");
    process.exit(1);
  }

  const skills: string[] = [];
  const entries = readdirSync(skillsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory());

  for (const entry of entries) {
    const skillMd = join(skillsDir, entry.name, "SKILL.md");
    if (existsSync(skillMd)) {
      skills.push(`.opencode/skills/${entry.name}/SKILL.md`);
    }
  }

  let config: Record<string, unknown> = {};
  if (existsSync(targetPath)) {
    try {
      const raw = readFileSync(targetPath, "utf-8");
      const stripped = raw.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
      config = JSON.parse(stripped);
    } catch {
      console.warn(`Warning: Could not parse ${targetPath}, creating new config.`);
    }
  }

  config.skills = skills;

  const lines = ["// opencode configuration", "{"];
  if (skills.length > 0) {
    lines.push('  "skills": [');
    skills.forEach((skill, i) => {
      const comma = i < skills.length - 1 ? "," : "";
      lines.push(`    "${skill}"${comma}`);
    });
    lines.push("  ]");
  }
  lines.push("}");
  lines.push("");

  mkdirSync(join(targetPath, ".."), { recursive: true });
  writeFileSync(targetPath, lines.join("\n"));

  console.log(`Registered ${skills.length} skills in ${targetPath}`);
}
