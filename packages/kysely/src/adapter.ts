import type { DatabaseAdapter, DatabaseContext } from "@fossyl/core";
import type { Kysely } from "kysely";
import { db as proxiedDb, setBaseClient, transactionContext } from "./context";
import { runMigrations } from "./migrations";
import type { KyselyAdapterOptions } from "./types";

export function kyselyAdapter<DB>(options: KyselyAdapterOptions<DB>): {
  adapter: DatabaseAdapter<Kysely<DB>>;
  db: Kysely<DB>;
} {
  const { client, migrations, autoMigrate = false, defaultTransaction = true } = options;
  const baseClient = client;
  setBaseClient(baseClient);

  const adapter: DatabaseAdapter<Kysely<DB>> = {
    type: "database",
    name: "kysely",
    client: proxiedDb as Kysely<DB>,
    defaultTransaction,
    autoMigrate,

    async onStartup(): Promise<void> {
      if (autoMigrate && migrations) {
        const result = await runMigrations(baseClient, migrations);

        if (result.error) {
          throw new Error(
            `Migration failed: ${result.error.message}. ` +
              `Executed: ${result.executed.join(", ") || "none"}`
          );
        }

        if (result.executed.length > 0) {
          console.log(`Migrations applied: ${result.executed.join(", ")}`);
        }
      }
    },

    async withTransaction<T>(fn: (ctx: DatabaseContext<Kysely<DB>>) => Promise<T>): Promise<T> {
      return baseClient.transaction().execute(async (trx) => {
        const ctx: DatabaseContext<Kysely<DB>> = {
          client: trx as unknown as Kysely<DB>,
          inTransaction: true,
        };
        return transactionContext.run({ trx, inTransaction: true }, () => fn(ctx));
      });
    },

    async withClient<T>(fn: (ctx: DatabaseContext<Kysely<DB>>) => Promise<T>): Promise<T> {
      const ctx: DatabaseContext<Kysely<DB>> = {
        client: baseClient,
        inTransaction: false,
      };
      return transactionContext.run({ trx: baseClient, inTransaction: false }, () => fn(ctx));
    },
  };

  return { adapter, db: proxiedDb as Kysely<DB> };
}
