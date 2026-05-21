import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { expressAdapter } from "@fossyl/express";
import { kyselyAdapter, createMigrationProvider } from "@fossyl/kysely";

import * as todoRoutes from "./features/todos/routes/todos.route";
import * as userRoutes from "./features/users/routes/users.route";
import { migrations } from "./db/migrations";
import type { DB } from "./db/schema";

let adapter: ReturnType<typeof expressAdapter>;

export async function start(port: number) {
  const sqliteDb = new Database(":memory:");
  const dialect = new SqliteDialect({ database: sqliteDb });
  const kyselyDb = new Kysely<DB>({ dialect });

  const { adapter: database } = kyselyAdapter({
    client: kyselyDb,
    migrations: createMigrationProvider(migrations),
    autoMigrate: true,
  });

  const allRoutes = [...todoRoutes.default, ...userRoutes.default];

  adapter = expressAdapter({ cors: false, database });
  adapter.register(allRoutes);
  await adapter.listen(port);
}

export async function stop() {
  await adapter.close();
}
