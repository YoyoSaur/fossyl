import { describe, it, expect } from "vitest";
import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import { registerCommand } from "../src/commands/register";

const HEADER = "// @generated — do not edit directly. Run `fossyl register` to regenerate.";

async function createTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "fossyl-register-"));
}

async function cleanup(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}

describe("registerCommand", () => {
  it("writes empty registry when no route files exist", async () => {
    const tempDir = await createTempDir();

    try {
      await registerCommand(tempDir);

      const registryPath = path.join(tempDir, "src", "registry.ts");
      const content = await fs.readFile(registryPath, "utf-8");
      expect(content).toBe(`${HEADER}\n\nconst routes: unknown[] = [];\n\nexport default routes;\n`);
    } finally {
      await cleanup(tempDir);
    }
  });

  it("imports route files and merges their exports", async () => {
    const tempDir = await createTempDir();

    try {
      const pingRoute = path.join(tempDir, "src", "features", "ping", "routes", "ping.route.ts");
      const usersRoute = path.join(tempDir, "src", "features", "users", "routes", "users.route.ts");

      await fs.mkdir(path.dirname(pingRoute), { recursive: true });
      await fs.mkdir(path.dirname(usersRoute), { recursive: true });

      await fs.writeFile(pingRoute, "export default [] as const;\n", "utf-8");
      await fs.writeFile(usersRoute, "export default [] as const;\n", "utf-8");

      await registerCommand(tempDir);

      const registryPath = path.join(tempDir, "src", "registry.ts");
      const content = await fs.readFile(registryPath, "utf-8");

      expect(content).toBe(
        `${HEADER}\n\n` +
          'import pingRoutes from "./features/ping/routes/ping.route";\n' +
          'import usersRoutes from "./features/users/routes/users.route";\n\n' +
          "const routes = [...pingRoutes, ...usersRoutes];\n\n" +
          "export default routes;\n"
      );
    } finally {
      await cleanup(tempDir);
    }
  });
});
