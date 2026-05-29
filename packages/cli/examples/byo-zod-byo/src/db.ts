/**
 * TODO: Implement your database adapter
 *
 * This file should:
 * 1. Set up your database connection (Prisma, Drizzle, raw SQL, etc.)
 * 2. Export a database client or query builder
 * 3. Optionally implement transaction support
 *
 * See packages/kysely/ for a reference implementation.
 */

export const db = {
  query: async (sql: string, params?: unknown[]) => {
    throw new Error('Database not implemented. See src/db.ts for instructions.');
  },
};
