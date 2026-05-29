import { sql } from 'kysely';
import { defineMigration } from '@fossyl/kysely';

export const migration = defineMigration({
  async up(db) {
    await db.schema
      .createTable('ping')
      .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
      .addColumn('message', 'text', (col) => col.notNull())
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) =>
        col.notNull().defaultTo(sql`(datetime('now'))`)
      )
      .execute();
  },

  async down(db) {
    await db.schema.dropTable('ping').execute();
  },
});
