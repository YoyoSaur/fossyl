import type { DialectChoice } from "../../prompts";

export function generateKyselySetup(dialect: DialectChoice = "postgres"): string {
  if (dialect === "sqlite") {
    return `import Database from 'better-sqlite3';
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
`;
  }

  if (dialect === "mysql") {
    return `import { createPool } from 'mysql2';
import { Kysely, MysqlDialect } from 'kysely';
import { createDbProxy } from '@fossyl/kysely';
import type { DB } from './types/db';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const client = new Kysely<DB>({
  dialect: new MysqlDialect({
    pool: createPool(connectionString),
  }),
});

export const db = createDbProxy<DB>();
`;
  }

  // PostgreSQL (default)
  return `import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { createDbProxy } from '@fossyl/kysely';
import type { DB } from './types/db';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const client = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString }),
  }),
});

export const db = createDbProxy<DB>();
`;
}

export function generateDbTypes(): string {
  return `import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

// Ping table types
export interface PingTable {
  id: Generated<number>;
  message: string;
  created_by: string;
  created_at: Generated<Date>;
}

export type Ping = Selectable<PingTable>;
export type NewPing = Insertable<PingTable>;
export type PingUpdate = Updateable<PingTable>;

// Database schema
export interface DB {
  ping: PingTable;
}
`;
}

export function generateMigrationIndex(): string {
  return `import { createMigrationProvider } from '@fossyl/kysely';
import { migration as m001 } from './001_create_ping';

export const migrations = createMigrationProvider({
  '001_create_ping': m001,
});
`;
}

export function generateMigrateScript(): string {
  return `import { client } from '@db';
import { migrations } from '../migrations';
import { runMigrations, createMigrationProvider } from '@fossyl/kysely';

const result = await runMigrations(client, createMigrationProvider(migrations));

if (result.error) {
  console.error('Migration failed:', result.error.message);
  process.exit(1);
}

console.log(\`Migrations applied: \${result.executed.join(', ')}\`);
`;
}

export function generatePingMigration(dialect: DialectChoice = "postgres"): string {
  if (dialect === "sqlite") {
    return `import { sql } from 'kysely';
import { defineMigration } from '@fossyl/kysely';

export const migration = defineMigration({
  async up(db) {
    await db.schema
      .createTable('ping')
      .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
      .addColumn('message', 'text', (col) => col.notNull())
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) =>
        col.notNull().defaultTo(sql\`(datetime('now'))\`)
      )
      .execute();
  },

  async down(db) {
    await db.schema.dropTable('ping').execute();
  },
});
`;
  }

  if (dialect === "mysql") {
    return `import { sql } from 'kysely';
import { defineMigration } from '@fossyl/kysely';

export const migration = defineMigration({
  async up(db) {
    await db.schema
      .createTable('ping')
      .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
      .addColumn('message', 'varchar(255)', (col) => col.notNull())
      .addColumn('created_by', 'varchar(255)', (col) => col.notNull())
      .addColumn('created_at', 'timestamp', (col) =>
        col.notNull().defaultTo(sql\`CURRENT_TIMESTAMP\`)
      )
      .execute();
  },

  async down(db) {
    await db.schema.dropTable('ping').execute();
  },
});
`;
  }

  // PostgreSQL (default)
  return `import { sql } from 'kysely';
import { defineMigration } from '@fossyl/kysely';

export const migration = defineMigration({
  async up(db) {
    await db.schema
      .createTable('ping')
      .addColumn('id', 'serial', (col) => col.primaryKey())
      .addColumn('message', 'varchar(255)', (col) => col.notNull())
      .addColumn('created_by', 'varchar(255)', (col) => col.notNull())
      .addColumn('created_at', 'timestamp', (col) =>
        col.notNull().defaultTo(sql\`now()\`)
      )
      .execute();
  },

  async down(db) {
    await db.schema.dropTable('ping').execute();
  },
});
`;
}
