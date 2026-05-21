import { AsyncLocalStorage } from "node:async_hooks";
import type { Kysely, Transaction } from "kysely";

/**
 * Transaction context stored in AsyncLocalStorage.
 */
export type TransactionContext<DB> = {
  trx: Transaction<DB> | Kysely<DB>;
  inTransaction: boolean;
};

/**
 * Internal storage type for AsyncLocalStorage.
 * Uses `any` internally to avoid variance issues with Kysely's complex types.
 */
type InternalTransactionContext = {
  trx: any;
  inTransaction: boolean;
};

/**
 * AsyncLocalStorage instance for managing transaction context.
 * This allows the transaction/client to be accessed anywhere in the call stack.
 */
export const transactionContext = new AsyncLocalStorage<InternalTransactionContext>();

/**
 * Get the current transaction or client from AsyncLocalStorage.
 * Use this in your service layer to access the database client.
 *
 * @throws Error if called outside of a database context
 *
 * @example
 * ```typescript
 * import { getTransaction } from '@fossyl/prisma-kysely';
 *
 * async function createUser(name: string) {
 *   const db = getTransaction<DB>();
 *   return db.insertInto('users').values({ name }).execute();
 * }
 * ```
 */
export function getTransaction<DB>(): Transaction<DB> | Kysely<DB> {
  const ctx = transactionContext.getStore();
  if (!ctx) {
    throw new Error("No database context available");
  }
  return ctx.trx as Transaction<DB> | Kysely<DB>;
}

/** @deprecated Use `getDb` instead */
export const getDb = getTransaction;

let _baseClient: Kysely<any> | null = null;

export function setBaseClient(client: Kysely<any>): void {
  _baseClient = client;
}

function isGetter(obj: any, prop: string | symbol): boolean {
  let proto = obj;
  while (proto) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    if (desc) {
      return !!desc.get;
    }
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}

export const db = new Proxy({} as Kysely<any>, {
  get(_, prop) {
    const store = transactionContext.getStore();
    const source = store?.trx ?? _baseClient;
    if (!source) {
      throw new Error(
        "No database context available. Call kyselyAdapter() or provide a database client first."
      );
    }
    const value = Reflect.get(source, prop, source);
    if (typeof value === "function" && !isGetter(source, prop)) {
      return value.bind(source);
    }
    return value;
  },
});
