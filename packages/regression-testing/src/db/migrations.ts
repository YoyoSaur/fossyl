import type { Kysely } from "kysely";

export const migrations = {
  "001_create_todos": {
    async up(db: Kysely<unknown>) {
      await db.schema
        .createTable("todos")
        .addColumn("id", "integer", (col) => col.autoIncrement().primaryKey())
        .addColumn("title", "text", (col) => col.notNull())
        .addColumn("completed", "integer", (col) => col.notNull().defaultTo(0))
        .addColumn("created_at", "text", (col) => col.notNull())
        .execute();
    },
    async down(db: Kysely<unknown>) {
      await db.schema.dropTable("todos").execute();
    },
  },
  "002_create_users": {
    async up(db: Kysely<unknown>) {
      await db.schema
        .createTable("users")
        .addColumn("id", "integer", (col) => col.autoIncrement().primaryKey())
        .addColumn("name", "text", (col) => col.notNull())
        .addColumn("email", "text", (col) => col.notNull())
        .addColumn("created_at", "text", (col) => col.notNull())
        .execute();
    },
    async down(db: Kysely<unknown>) {
      await db.schema.dropTable("users").execute();
    },
  },
};
