import type { PrismaKyselyAdapterOptions } from './types';

/**
 * Emit the setup code for the generated server file.
 * This includes imports, AsyncLocalStorage context, and the Kysely proxy.
 *
 * @param options - The adapter configuration options
 * @returns The setup code as a string
 */
export function emitSetup(options: PrismaKyselyAdapterOptions): string {
  return `
// ============================================
// Database: Prisma-Kysely Transaction Context
// ============================================

import { AsyncLocalStorage } from 'node:async_hooks';
import type { Transaction } from 'kysely';
import { kq as _kq } from '${options.kysely}';

// Transaction context
const txContext = new AsyncLocalStorage<Transaction<unknown>>();

function getActiveTransaction(): Transaction<unknown> | undefined {
  return txContext.getStore();
}

// Proxy that routes queries through active transaction
const kq = new Proxy(_kq, {
  get(target, prop, receiver) {
    const activeTx = getActiveTransaction();
    if (activeTx) {
      return Reflect.get(activeTx, prop, activeTx);
    }
    return Reflect.get(target, prop, receiver);
  },
});

// Transaction wrapper
async function withTransaction<T>(callback: () => Promise<T>): Promise<T> {
  return _kq.transaction().execute(async (tx) => {
    return txContext.run(tx, callback);
  });
}
`.trim();
}

/**
 * Emit wrapper code for a route handler.
 * Optionally wraps the handler code in a transaction.
 *
 * @param handlerCode - The handler code to wrap
 * @param useTransaction - Whether to wrap in a transaction
 * @returns The wrapped handler code
 */
export function emitWrapper(
  handlerCode: string,
  useTransaction: boolean
): string {
  if (useTransaction) {
    return `await withTransaction(async () => {
  ${handlerCode}
})`;
  }

  return handlerCode;
}

/**
 * Emit startup code for the generated server.
 * This runs migrations if autoMigrate is enabled.
 *
 * @param options - The adapter configuration options
 * @returns The startup code as a string (empty if autoMigrate is false)
 */
export function emitStartup(options: PrismaKyselyAdapterOptions): string {
  if (!options.autoMigrate) {
    return '';
  }

  return `
// Auto-migrate on startup
if (process.env.NODE_ENV !== 'test') {
  const { execSync } = await import('child_process');
  console.log('Running database migrations...');
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
}
`.trim();
}
