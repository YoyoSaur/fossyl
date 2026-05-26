import { expressAdapter } from "@fossyl/express";
import { kyselyAdapter, createMigrationProvider } from "@fossyl/kysely";

// @code: start imports
import * as todoRoutes from "./features/todos/routes/todos.route";
import * as userRoutes from "./features/users/routes/users.route";
import { client } from "./db";
import { migrations } from "./db/migrations";
// @code: end imports

let adapter: ReturnType<typeof expressAdapter>;

// @code: start app-bootstrap
export async function start(port: number) {
  const { adapter: database } = kyselyAdapter({
    client,
    migrations: createMigrationProvider(migrations),
    autoMigrate: true,
  });

  const allRoutes = [...todoRoutes.default, ...userRoutes.default];

  adapter = expressAdapter({ cors: false, database });
  adapter.register(allRoutes);
  await adapter.listen(port);
}
// @code: end app-bootstrap

export async function stop() {
  await adapter.close();
}
