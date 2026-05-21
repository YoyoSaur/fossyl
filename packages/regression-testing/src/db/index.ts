import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { createDbProxy } from "@fossyl/kysely";
import type { DB } from "./schema";

const sqliteDb = new Database(":memory:");
const dialect = new SqliteDialect({ database: sqliteDb });

export const client = new Kysely<DB>({ dialect });
export const db = createDbProxy<DB>();
