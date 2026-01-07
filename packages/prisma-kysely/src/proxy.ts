import type { Kysely } from 'kysely';
import { getActiveTransaction } from './context';

/**
 * Create a proxy around a Kysely instance that automatically routes queries
 * through the active transaction from AsyncLocalStorage context.
 *
 * This enables transparent transaction handling - handler code doesn't need
 * to know about transactions at all. The generated wrapper sets up the
 * transaction context, and this proxy ensures all queries use it.
 *
 * @example
 * ```typescript
 * // Original Kysely instance
 * const _kq = new Kysely<DB>({ dialect });
 *
 * // Proxied instance - automatically uses active transaction
 * export const kq = createTransactionProxy(_kq);
 *
 * // Handler code - no transaction awareness needed
 * const user = await kq.selectFrom('users')
 *   .where('id', '=', userId)
 *   .executeTakeFirst();
 * // If called within withTransaction(), uses that transaction automatically
 * ```
 *
 * @param db - The Kysely database instance to proxy
 * @returns A proxied Kysely instance that uses active transactions
 */
export function createTransactionProxy<DB>(db: Kysely<DB>): Kysely<DB> {
  return new Proxy(db, {
    get(target, prop, receiver) {
      // Check for an active transaction in the AsyncLocalStorage context
      const activeTx = getActiveTransaction();

      if (activeTx) {
        // Route property access to the transaction
        return Reflect.get(activeTx, prop, activeTx);
      }

      // No active transaction, use the base database instance
      return Reflect.get(target, prop, receiver);
    },
  });
}
