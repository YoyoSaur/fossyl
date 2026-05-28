import type { DatabaseAdapter, DatabaseContext } from "@fossyl/core";
import { fossylConflict, fossylInternal } from "@fossyl/core";
import type { Kysely } from "kysely";
import { db as proxiedDb, setBaseClient, transactionContext } from "./context";
import { runMigrations } from "./migrations";
import type { KyselyAdapterOptions } from "./types";

function isConstraintViolation(err: unknown): boolean {
  const code = (err as { code?: unknown })?.code;
  // PostgreSQL unique violation → 23505, foreign_key → 23503
  // MySQL duplicate entry → 1062
  return code === 23505 || code === 23503 || code === 1062;
}

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
      try {
        return await baseClient.transaction().execute(async (trx) => {
          const ctx: DatabaseContext<Kysely<DB>> = {
            client: trx as unknown as Kysely<DB>,
            inTransaction: true,
          };
          return transactionContext.run({ trx, inTransaction: true }, () => fn(ctx));
        });
      } catch (err) {
        if (isConstraintViolation(err)) {
          throw fossylConflict(
            err instanceof Error ? err.message : "Database constraint violation",
            { originalError: err }
          );
        }
        throw fossylInternal(
          err instanceof Error ? err.message : "Database query failed",
          { originalError: err }
        );
      }
    },

    async withClient<T>(fn: (ctx: DatabaseContext<Kysely<DB>>) => Promise<T>): Promise<T> {
      try {
        const ctx: DatabaseContext<Kysely<DB>> = {
          client: baseClient,
          inTransaction: false,
        };
        return await transactionContext.run({ trx: baseClient, inTransaction: false }, () =>
          fn(ctx)
        );
      } catch (err) {
        if (isConstraintViolation(err)) {
          throw fossylConflict(
            err instanceof Error ? err.message : "Database constraint violation",
            { originalError: err }
          );
        }
        throw fossylInternal(
          err instanceof Error ? err.message : "Database query failed",
          { originalError: err }
        );
      }
    },
  };

  return { adapter, db: proxiedDb as Kysely<DB> };
}
