/**
 * Configuration options for the Prisma-Kysely database adapter.
 *
 * This adapter provides automatic transaction handling using AsyncLocalStorage
 * and a proxy pattern that routes Kysely queries through active transactions.
 */
export type PrismaKyselyAdapterOptions = {
  /**
   * Path to Kysely client module (must export `kq` as the Kysely instance).
   *
   * @example './src/lib/db'
   */
  kysely: string;

  /**
   * Run `prisma db push` on startup to apply schema changes.
   *
   * @default false
   */
  autoMigrate?: boolean;

  /**
   * Whether routes use transactions by default.
   * Routes can opt out with `transaction: false`.
   *
   * @default true
   */
  defaultTransaction?: boolean;
};
