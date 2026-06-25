import { parseArgs } from "node:util";
import { createRequire } from "node:module";
import path from "node:path";
import { createCommand } from "./commands/create";
import { addSkillsCommand } from "./commands/add-skills";
import { registerCommand } from "./commands/register";
import { registerSkillsCommand } from "./commands/register-skills";
import type {
  ServerChoice,
  ValidatorChoice,
  DatabaseChoice,
  DialectChoice,
  CliOptions,
} from "./prompts";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const { values, positionals } = parseArgs({
  options: {
    create: { type: "boolean" },
    help: { type: "boolean", short: "h" },
    register: { type: "boolean" },
    "register-skills": { type: "boolean" },
    global: { type: "boolean" },
    version: { type: "boolean", short: "v" },
    "add-skills": { type: "boolean" },
    adapter: { type: "string" },
    list: { type: "boolean" },
    // Non-interactive options
    server: { type: "string", short: "s" },
    validator: { type: "string" },
    database: { type: "string", short: "d" },
    dialect: { type: "string" },
    docker: { type: "boolean" },
    "no-docker": { type: "boolean" },
    default: { type: "boolean" },
  },
  allowPositionals: true,
});

function showHelp() {
  console.log(`
fossyl - CLI for scaffolding fossyl projects

Usage:
  npx fossyl --create <project-name>   Create a new fossyl project (interactive)
  npx fossyl register                 Generate src/registry.ts from feature route files
  npx fossyl register-skills           Register .opencode/skills/ in opencode.jsonc
  npx fossyl register-skills --global  Register in ~/.opencode/opencode.json
  npx fossyl add-skills               Install fossyl skills into .opencode/skills/
  npx fossyl add-skills --list         List available skills
  npx fossyl add-skills --adapter <a>  Install skills for specific adapters
  npx fossyl register [dir]           Generate src/registry.ts from route files
  npx fossyl --help                   Show this help message
  npx fossyl --version                Show version

Non-interactive mode:
  npx fossyl --create <name> --server <s> --validator <v> --database <d> [options]

Options:
  --default         Use all defaults: express + zod + kysely/sqlite + docker
  --server, -s      Server adapter: express (default) | byo
  --validator       Validation library: zod (default) | byo
  --database, -d    Database adapter: kysely (default) | byo
  --dialect         Database dialect (when using kysely): sqlite (default) | postgres | mysql
  --docker          Include Docker setup (default: true)
  --no-docker       Exclude Docker setup

Examples:
  # Interactive mode
  npx fossyl --create my-api

  # Non-interactive with all defaults (express + zod + kysely/sqlite + docker)
  npx fossyl --create my-api --default

  # Non-interactive with PostgreSQL
  npx fossyl --create my-api -s express --validator zod -d kysely --dialect postgres

  # Non-interactive without docker
  npx fossyl --create my-api -s express --validator zod -d kysely --no-docker

  # BYO everything
  npx fossyl --create my-api --server byo --validator byo --database byo

  # Skills
  npx fossyl add-skills
  npx fossyl add-skills --adapter express,kysely
  npx fossyl add-skills --list
`);
}

function showVersion() {
  console.log(`fossyl v${pkg.version}`);
}

function parseCliOptions(): CliOptions | null {
  // If no adapter options provided and no --default flag, return null to trigger interactive mode
  if (!values.server && !values.validator && !values.database && !values.default) {
    return null;
  }

  // --default flag sets all recommended options
  if (values.default) {
    return {
      server: "express",
      validator: "zod",
      database: "kysely",
      dialect: "sqlite",
      docker: !values["no-docker"],
    };
  }

  const serverChoices = ["express", "byo"];
  const validatorChoices = ["zod", "byo"];
  const databaseChoices = ["kysely", "byo"];
  const dialectChoices = ["sqlite", "postgres", "mysql"];

  const server = (values.server as string) || "express";
  const validator = (values.validator as string) || "zod";
  const database = (values.database as string) || "kysely";
  const dialect = (values.dialect as string) || "sqlite";

  if (!serverChoices.includes(server)) {
    console.error(`Invalid --server value: ${server}. Must be one of: ${serverChoices.join(", ")}`);
    process.exit(1);
  }

  if (!validatorChoices.includes(validator)) {
    console.error(
      `Invalid --validator value: ${validator}. Must be one of: ${validatorChoices.join(", ")}`
    );
    process.exit(1);
  }

  if (!databaseChoices.includes(database)) {
    console.error(
      `Invalid --database value: ${database}. Must be one of: ${databaseChoices.join(", ")}`
    );
    process.exit(1);
  }

  if (database === "kysely" && !dialectChoices.includes(dialect)) {
    console.error(
      `Invalid --dialect value: ${dialect}. Must be one of: ${dialectChoices.join(", ")}`
    );
    process.exit(1);
  }

  // Handle docker flag: --docker sets true, --no-docker sets false, default is true
  let docker = true;
  if (values["no-docker"]) {
    docker = false;
  } else if (values.docker !== undefined) {
    docker = values.docker;
  }

  return {
    server: server as ServerChoice,
    validator: validator as ValidatorChoice,
    database: database as DatabaseChoice,
    dialect: database === "kysely" ? (dialect as DialectChoice) : undefined,
    docker,
  };
}

async function main() {
  const subcommand = positionals[0];

  if (subcommand === "register-skills" || values["register-skills"]) {
    await registerSkillsCommand({ global: !!values.global });
  } else if (subcommand === "add-skills" || values["add-skills"]) {
    const adapters = values.adapter
      ? (values.adapter as string).split(",").map((s) => s.trim())
      : undefined;
    await addSkillsCommand({ adapters, list: !!values.list });
  } else if (subcommand === "register" || values.register) {
    const targetDir =
      subcommand === "register" && positionals[1]
        ? path.resolve(process.cwd(), positionals[1])
        : process.cwd();
    await registerCommand(targetDir);
  } else if (values.version) {
    showVersion();
  } else if (values.create) {
    const cliOptions = parseCliOptions();
    await createCommand(positionals[0], cliOptions);
  } else if (values.help) {
    showHelp();
  } else {
    showHelp();
  }
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
