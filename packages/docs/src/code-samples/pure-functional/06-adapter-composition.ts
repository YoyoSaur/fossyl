// @code-block-start: adapter-composition
// Adapters are standalone modules composed in src/index.ts
import type { LoggerAdapter, DatabaseAdapter } from '@fossyl/core';
import { expressAdapter } from '@fossyl/express';

const database: DatabaseAdapter = {
  type: 'database',
  name: 'kysely',
  client: db,
  defaultTransaction: true,
  autoMigrate: true,
  onStartup: async () => {},
  withTransaction: async (fn) => fn({ client: db, inTransaction: true }),
  withClient: async (fn) => fn({ client: db, inTransaction: false }),
};

const logger: LoggerAdapter = {
  type: 'logger',
  name: 'pino',
  createLogger: (requestId) => ({
    info: (msg, meta) => pino.info({ requestId, ...meta }, msg),
    warn: (msg, meta) => pino.warn({ requestId, ...meta }, msg),
    error: (msg, meta) => pino.error({ requestId, ...meta }, msg),
  }),
};

const adapter = expressAdapter({
  cors: true,
  database,
  logger,
});

adapter.register(routes);
await adapter.listen(3000);
// @code-block-end: adapter-composition
