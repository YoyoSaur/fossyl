// @code-block-start: database-adapter
// Database adapters implement the DatabaseAdapter interface.
// Created independently, then composed into the framework adapter.
import type { DatabaseAdapter } from 'fossyl';
import { expressAdapter } from '@fossyl/express';

const dbAdapter: DatabaseAdapter = {
  type: 'database',
  name: 'kysely',
  client: db,
  defaultTransaction: true,
  autoMigrate: true,

  onStartup: async () => {
    await migrateToLatest();
  },

  withTransaction: async (fn) => {
    return db.transaction().execute((trx) => {
      return fn({ client: trx, inTransaction: true });
    });
  },

  withClient: async (fn) => {
    return fn({ client: db, inTransaction: false });
  },
};

const adapter = expressAdapter({
  cors: true,
  database: dbAdapter,
});

adapter.register(routes);
await adapter.listen(3000);
// @code-block-end: database-adapter
