import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import { createDbProxy } from '@fossyl/kysely';
import type { DB } from './types/db';

const databasePath = process.env.DATABASE_PATH || './data/app.db';

export const client = new Kysely<DB>({
  dialect: new SqliteDialect({
    database: new Database(databasePath),
  }),
});

export const db = createDbProxy<DB>();
