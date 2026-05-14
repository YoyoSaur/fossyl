// @code-block-start: adapter-composition
// Adapters are standalone modules composed in src/index.ts
import type { LoggerAdapter } from 'fossyl';
import { kyselyAdapter } from '@fossyl/kysely';
import { expressAdapter } from '@fossyl/express';

const database = kyselyAdapter({
  client: db,
  migrations,
  autoMigrate: true,
});

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
