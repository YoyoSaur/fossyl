// Main adapter export
export { prismaKyselyAdapter } from './adapter';

// Type exports
export type { PrismaKyselyAdapterOptions } from './types';

// Transaction context utilities (for advanced use cases)
export {
  getActiveTransaction,
  withTransaction,
  withoutTransaction,
  transactionContext,
} from './context';

// Proxy utility (for advanced use cases)
export { createTransactionProxy } from './proxy';
