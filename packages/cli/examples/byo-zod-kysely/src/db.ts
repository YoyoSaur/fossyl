import { createDbProxy } from '@fossyl/kysely';
import type { DB } from './types/db';
import type { Kysely } from 'kysely';

let client: Kysely<DB>;

const url = process.env.DATABASE_URL;
if (url) {
  const { createClient } = await import('@libsql/client');
  const { Kysely: KyselyClient } = await import('kysely');
  const { LibsqlDialect } = await import('@libsql/kysely-libsql');
  client = new KyselyClient<DB>({
    dialect: new LibsqlDialect({ client: createClient({ url }) }),
  });
} else {
  const Database = (await import('better-sqlite3')).default;
  const { Kysely: KyselyClient, SqliteDialect } = await import('kysely');
  const dbPath = process.env.DATABASE_PATH || './data/app.db';
  client = new KyselyClient<DB>({
    dialect: new SqliteDialect({ database: new Database(dbPath) }),
  });
}

export { client };
export const db = createDbProxy<DB>();
