import * as fs from "node:fs";
import * as path from "node:path";
import { createRequire } from "node:module";
import type { ProjectOptions } from "./prompts";
import {
  generatePackageJson,
  generateTsConfig,
  generateEnvExample,
  generateClaudeMd,
  generateAuth,
  generateEslintConfig,
} from "./templates/base";
import { generateExpressIndex, generateByoServerIndex } from "./templates/server/express";
import { generateByoServerPlaceholder } from "./templates/server/byo";
import {
  generateKyselySetup,
  generateDbTypes,
  generateMigrationIndex,
  generatePingMigration,
  generateMigrateScript,
} from "./templates/database/kysely";
import { generateByoDatabasePlaceholder } from "./templates/database/byo";
import { generateZodValidators } from "./templates/validator/zod";
import { generateByoValidatorPlaceholder } from "./templates/validator/byo";
import { generatePingRoute, generatePingService, generatePingRepo } from "./templates/feature/ping";
import {
  generateDockerfile,
  generateDockerignore,
  generateDockerCompose,
} from "./templates/docker";

export interface FileEntry {
  path: string;
  content: string;
}

const require = createRequire(import.meta.url);

function isDefaultOptions(options: ProjectOptions): boolean {
  return (
    options.server === "express" &&
    options.validator === "zod" &&
    options.database === "kysely" &&
    options.dialect === "sqlite" &&
    options.docker === true
  );
}

function readExampleFiles(exampleDir: string, projectName: string): FileEntry[] {
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
        let content = fs.readFileSync(fullPath, "utf-8");
        const relativePath = path.relative(root, fullPath);
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
  // Use the canonical example for the default combination
  if (isDefaultOptions(options)) {
    return readExampleFiles("example", options.name);
  }

  const files: FileEntry[] = [];

  // Base files
  files.push({
    path: "package.json",
    content: generatePackageJson(options),
  });
  files.push({
    path: "tsconfig.json",
    content: generateTsConfig(),
  });
  files.push({
    path: ".env.example",
    content: generateEnvExample(options),
  });
  files.push({
    path: "CLAUDE.md",
    content: generateClaudeMd(options),
  });
  files.push({
    path: "eslint.config.js",
    content: generateEslintConfig(),
  });

  // Main entry point
  if (options.server === "express") {
    files.push({
      path: "src/index.ts",
      content: generateExpressIndex(options),
    });
  } else {
    files.push({
      path: "src/index.ts",
      content: generateByoServerIndex(options),
    });
    files.push({
      path: "src/server.ts",
      content: generateByoServerPlaceholder(),
    });
  }

  // Auth file
  files.push({
    path: "src/auth.ts",
    content: generateAuth(),
  });

  // Database files
  if (options.database === "kysely") {
    files.push({
      path: "src/db.ts",
      content: generateKyselySetup(options.dialect),
    });
    files.push({
      path: "src/types/db.ts",
      content: generateDbTypes(),
    });
    files.push({
      path: "src/migrations/index.ts",
      content: generateMigrationIndex(),
    });
    files.push({
      path: "src/migrations/001_create_ping.ts",
      content: generatePingMigration(options.dialect),
    });
    files.push({
      path: "src/migrate.ts",
      content: generateMigrateScript(),
    });
  } else {
    files.push({
      path: "src/db.ts",
      content: generateByoDatabasePlaceholder(),
    });
    files.push({
      path: "src/types/db.ts",
      content: "// TODO: Define your database types here\nexport interface DB {}\n",
    });
  }

  // Validator files
  if (options.validator === "zod") {
    files.push({
      path: "src/features/ping/validators/ping.validators.ts",
      content: generateZodValidators(),
    });
  } else {
    files.push({
      path: "src/features/ping/validators/ping.validators.ts",
      content: generateByoValidatorPlaceholder(),
    });
  }

  // Feature files (ping)
  files.push({
    path: "src/features/ping/routes/ping.route.ts",
    content: generatePingRoute(options),
  });
  files.push({
    path: "src/features/ping/services/ping.service.ts",
    content: generatePingService(options),
  });
  files.push({
    path: "src/features/ping/repo/ping.repo.ts",
    content: generatePingRepo(options),
  });

  // Docker files
  if (options.docker) {
    files.push({
      path: "Dockerfile",
      content: generateDockerfile(),
    });
    files.push({
      path: ".dockerignore",
      content: generateDockerignore(),
    });
    files.push({
      path: "docker-compose.yml",
      content: generateDockerCompose(options.dialect),
    });
  }

  return files;
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
