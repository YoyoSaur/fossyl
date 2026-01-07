import type { DatabaseAdapter } from '@fossyl/core';
import type { PrismaKyselyAdapterOptions } from './types';
import { emitSetup, emitWrapper, emitStartup } from './emitter';

/**
 * Create a Prisma-Kysely database adapter for fossyl.
 *
 * This adapter provides automatic transaction handling using AsyncLocalStorage
 * and a proxy pattern. Prisma handles schema and migrations, while Kysely
 * handles type-safe queries.
 *
 * @example
 * ```typescript
 * // fossyl.config.ts
 * import { defineConfig } from '@fossyl/core';
 * import { expressAdapter } from '@fossyl/express';
 * import { prismaKyselyAdapter } from '@fossyl/prisma-kysely';
 *
 * export default defineConfig({
 *   routes: './src/routes',
 *   output: './src/server.generated.ts',
 *   adapters: {
 *     framework: expressAdapter({ cors: true }),
 *     database: prismaKyselyAdapter({
 *       kysely: './src/lib/db',
 *       autoMigrate: true,
 *       defaultTransaction: true,
 *     }),
 *   },
 * });
 * ```
 *
 * @param options - Configuration options for the adapter
 * @returns A DatabaseAdapter that can be used in fossyl config
 */
export function prismaKyselyAdapter(
  options: PrismaKyselyAdapterOptions
): DatabaseAdapter {
  return {
    type: 'database',
    name: 'prisma-kysely',
    clientPath: options.kysely,
    defaultTransaction: options.defaultTransaction ?? true,
    autoMigrate: options.autoMigrate ?? false,

    emitSetup() {
      return emitSetup(options);
    },

    emitWrapper(handlerCode: string, useTransaction: boolean) {
      return emitWrapper(handlerCode, useTransaction);
    },

    emitStartup() {
      return emitStartup(options);
    },
  };
}
