import { AsyncLocalStorage } from 'node:async_hooks';
import type { Transaction } from 'kysely';

/**
 * AsyncLocalStorage store for the active transaction.
 * This allows automatic transaction propagation across async calls.
 */
const transactionContext = new AsyncLocalStorage<Transaction<unknown>>();

/**
 * Get the active transaction from the AsyncLocalStorage context.
 *
 * @returns The active transaction if one exists, undefined otherwise.
 */
export function getActiveTransaction(): Transaction<unknown> | undefined {
  return transactionContext.getStore();
}

/**
 * Run a callback within a transaction context.
 * The transaction will be automatically available to all Kysely queries
 * executed within the callback via the proxy pattern.
 *
 * @param db - The Kysely database instance
 * @param callback - The callback to execute within the transaction
 * @returns The result of the callback
 */
export async function withTransaction<T>(
  db: {
    transaction: () => {
      execute: <R>(cb: (tx: Transaction<unknown>) => Promise<R>) => Promise<R>;
    };
  },
  callback: () => Promise<T>
): Promise<T> {
  return db.transaction().execute(async (tx) => {
    return transactionContext.run(tx, callback);
  });
}

/**
 * Run a callback without a transaction context, even if a parent context has one.
 * This is useful for operations that should not be rolled back if the
 * parent transaction fails (e.g., audit logging).
 *
 * @param callback - The callback to execute without a transaction
 * @returns The result of the callback
 */
export async function withoutTransaction<T>(
  callback: () => Promise<T>
): Promise<T> {
  return transactionContext.run(
    undefined as unknown as Transaction<unknown>,
    callback
  );
}

export { transactionContext };
