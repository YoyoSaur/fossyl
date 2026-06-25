import path from "node:path";
import { promises as fs } from "node:fs";

const GENERATED_HEADER = "// @generated — do not edit directly. Run `fossyl register` to regenerate.";
const ROUTE_FILE_REGEX = /\.route\.(ts|tsx)$/i;

async function collectRouteFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name === "node_modules") continue;

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectRouteFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && ROUTE_FILE_REGEX.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function toImportName(relativePath: string, index: number, used: Set<string>): string {
  const baseName = path.basename(relativePath).replace(/\.route(\.[^.]+)?$/, "");

  const segments = baseName
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1));

  let candidate = segments.length > 0 ? segments.join("") : `Route${index}`;
  candidate = candidate.charAt(0).toLowerCase() + candidate.slice(1) + "Routes";

  let name = candidate;
  let suffix = 1;
  while (used.has(name)) {
    name = `${candidate}${++suffix}`;
  }

  used.add(name);
  return name;
}

function buildRegistryContent(relativeRouteFiles: string[]): string {
  if (relativeRouteFiles.length === 0) {
    return `${GENERATED_HEADER}\n\nconst routes: unknown[] = [];\n\nexport default routes;\n`;
  }

  const usedNames = new Set<string>();
  const imports: string[] = [];
  const spreads: string[] = [];

  relativeRouteFiles.forEach((relativePath, index) => {
    const importName = toImportName(relativePath, index, usedNames);
    const importPath = `./${relativePath.replace(/\\/g, "/").replace(/\.(ts|tsx)$/, "")}`;
    imports.push(`import ${importName} from "${importPath}";`);
    spreads.push(`...${importName}`);
  });

  const importsBlock = imports.join("\n");
  const spreadsList = spreads.join(", ");

  return `${GENERATED_HEADER}\n\n${importsBlock}\n\nconst routes = [${spreadsList}];\n\nexport default routes;\n`;
}

export async function registerCommand(projectRoot = process.cwd()): Promise<void> {
  const srcDir = path.join(projectRoot, "src");
  const featuresDir = path.join(srcDir, "features");
  const registryPath = path.join(srcDir, "registry.ts");

  const featuresExists = await fs
    .stat(featuresDir)
    .then((stat) => stat.isDirectory())
    .catch(() => false);

  const routeFiles = featuresExists ? await collectRouteFiles(featuresDir) : [];
  const sortedRouteFiles = routeFiles
    .map((fullPath) => path.relative(srcDir, fullPath))
    .map((relativePath) => relativePath.replace(/\\/g, "/"))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const content = buildRegistryContent(sortedRouteFiles);

  await fs.mkdir(path.dirname(registryPath), { recursive: true });
  await fs.writeFile(registryPath, content, "utf-8");

  const message = sortedRouteFiles.length === 0
    ? "Generated src/registry.ts with no routes found."
    : `Generated src/registry.ts with ${sortedRouteFiles.length} route file${sortedRouteFiles.length === 1 ? "" : "s"}.`;

  console.log(message);
}
