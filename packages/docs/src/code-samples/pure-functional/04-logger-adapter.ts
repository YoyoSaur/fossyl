// @code-block-start: logger-adapter
// Logger adapters are pure functional interfaces.
// Created standalone, then passed to the framework adapter.
import type { LoggerAdapter } from '@fossyl/core';
import { expressAdapter, getLogger } from '@fossyl/express';
import { createRouter } from '@fossyl/core';

const router = createRouter<"/api">("/api");

const pinoLogger: LoggerAdapter = {
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
  logger: pinoLogger,
});

const myRoute = router.createEndpoint('/api/logs').get(
  async () => {
    const logger = getLogger();
    logger.info('Handling request');
    return { typeName: 'Ok' as const, status: 'logged' };
  },
);
// @code-block-end: logger-adapter
