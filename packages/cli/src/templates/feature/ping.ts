import type { ProjectOptions } from '../../prompts';

export function generatePingRoute(options: ProjectOptions): string {
  const validatorImport =
    options.validator === 'zod'
      ? `import {
  createPingValidator,
  updatePingValidator,
  listPingQueryValidator,
} from '../validators/ping.validators';`
      : `import {
  createPingValidator,
  updatePingValidator,
  listPingQueryValidator,
} from '../validators/ping.validators';`;

  return `import { createRouter } from '@fossyl/core';
import type { PaginatedResponse } from '@fossyl/core';
import * as pingService from '../services/ping.service';
import { authenticator } from '../../../auth';
${validatorImport}

/**
 * Ping feature routes demonstrating all 5 route types:
 * - ListRoute: GET /ping (paginated list with filters)
 * - OpenRoute: GET /ping/:id (get one)
 * - FullRoute: POST /ping (authenticated + validated)
 * - FullRoute: PUT /ping/:id (authenticated + validated)
 * - AuthenticatedRoute: DELETE /ping/:id (authenticated only)
 */

const router = createRouter('/ping');

// ListRoute - Paginated list with optional filters (public)
// Pagination params (page, pageSize) are automatically parsed by the framework
export const listPings = router.createEndpoint('/ping').list({
  queryValidator: listPingQueryValidator,
  paginationConfig: { defaultPageSize: 20, maxPageSize: 100 },
  handler: async ({ query, pagination }): Promise<PaginatedResponse<pingService.PingData>> => {
    const result = await pingService.listPings(pagination, query);
    return {
      data: result.data,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        hasMore: result.hasMore,
        total: result.total,
      },
    };
  },
});

// OpenRoute - Get single ping (public)
export const getPing = router.createEndpoint('/ping/:id').get({
  handler: async ({ url }) => {
    const ping = await pingService.getPing(url.id);
    return {
      typeName: 'Ping' as const,
      ...ping,
    };
  },
});

// FullRoute - Create ping (authenticated + validated)
export const createPing = router.createEndpoint('/ping').post({
  authenticator,
  validator: createPingValidator,
  handler: async ({ url }, auth, body) => {
    const ping = await pingService.createPing(body.message, auth.userId);
    return {
      typeName: 'Ping' as const,
      ...ping,
    };
  },
});

// FullRoute - Update ping (authenticated + validated)
export const updatePing = router.createEndpoint('/ping/:id').put({
  authenticator,
  validator: updatePingValidator,
  handler: async ({ url }, auth, body) => {
    const ping = await pingService.updatePing(url.id, body, auth.userId);
    return {
      typeName: 'Ping' as const,
      ...ping,
    };
  },
});

// AuthenticatedRoute - Delete ping (authenticated only, no body)
export const deletePing = router.createEndpoint('/ping/:id').delete({
  authenticator,
  handler: async ({ url }, auth) => {
    await pingService.deletePing(url.id, auth.userId);
    return {
      typeName: 'DeleteResult' as const,
      id: url.id,
      deleted: true,
    };
  },
});

export default [listPings, getPing, createPing, updatePing, deletePing];
`;
}

export function generatePingService(_options: ProjectOptions): string {
  return `import type { PaginationParams } from '@fossyl/core';
import * as pingRepo from '../repo/ping.repo';

export interface PingData {
  id: number;
  message: string;
  created_by: string;
  created_at: Date;
}

export interface PingListResult {
  data: PingData[];
  hasMore: boolean;
  total?: number;
}

export interface PingFilters {
  search?: string;
}

/**
 * Lists pings with pagination using the N+1 trick for hasMore.
 * Optionally includes total count (more expensive).
 */
export async function listPings(
  pagination: PaginationParams,
  filters: PingFilters
): Promise<PingListResult> {
  // N+1 trick: fetch one extra to determine hasMore without COUNT query
  const results = await pingRepo.findAll(pagination.pageSize + 1, pagination.page, filters);
  const hasMore = results.length > pagination.pageSize;
  const data = hasMore ? results.slice(0, pagination.pageSize) : results;

  // Optional: get total count (expensive for large tables)
  const total = await pingRepo.count(filters);

  return { data, hasMore, total };
}

export async function getPing(id: string): Promise<PingData> {
  const ping = await pingRepo.findById(id);
  if (!ping) {
    throw new Error('Ping not found');
  }
  return ping;
}

export async function createPing(message: string, userId: string): Promise<PingData> {
  return pingRepo.create({ message, created_by: userId });
}

export async function updatePing(
  id: string,
  data: { message?: string },
  userId: string
): Promise<PingData> {
  const existing = await pingRepo.findById(id);
  if (!existing) {
    throw new Error('Ping not found');
  }
  // Optional: Check if user owns the ping
  // if (existing.created_by !== userId) {
  //   throw new Error('Not authorized');
  // }
  return pingRepo.update(id, data);
}

export async function deletePing(id: string, userId: string): Promise<void> {
  const existing = await pingRepo.findById(id);
  if (!existing) {
    throw new Error('Ping not found');
  }
  // Optional: Check if user owns the ping
  // if (existing.created_by !== userId) {
  //   throw new Error('Not authorized');
  // }
  await pingRepo.remove(id);
}
`;
}

export function generatePingRepo(options: ProjectOptions): string {
  if (options.database === 'kysely') {
    return generateKyselyPingRepo();
  }
  return generateByoPingRepo();
}

function generateKyselyPingRepo(): string {
  return `import { getTransaction } from '@fossyl/kysely';
import type { DB, Ping, NewPing, PingUpdate } from '../../../types/db';

export interface PingFilters {
  search?: string;
}

export async function findAll(
  limit: number,
  page: number,
  filters: PingFilters
): Promise<Ping[]> {
  const db = getTransaction<DB>();
  let query = db.selectFrom('ping').selectAll();

  // Apply filters
  if (filters.search) {
    query = query.where('message', 'like', \`%\${filters.search}%\`);
  }

  return query
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset((page - 1) * (limit - 1)) // -1 because we fetch N+1 for hasMore
    .execute();
}

export async function count(filters: PingFilters): Promise<number> {
  const db = getTransaction<DB>();
  let query = db.selectFrom('ping').select(db.fn.countAll().as('count'));

  if (filters.search) {
    query = query.where('message', 'like', \`%\${filters.search}%\`);
  }

  const result = await query.executeTakeFirst();
  return Number(result?.count ?? 0);
}

export async function findById(id: string): Promise<Ping | undefined> {
  const db = getTransaction<DB>();
  return db
    .selectFrom('ping')
    .where('id', '=', Number(id))
    .selectAll()
    .executeTakeFirst();
}

export async function create(data: Omit<NewPing, 'id' | 'created_at'>): Promise<Ping> {
  const db = getTransaction<DB>();
  return db
    .insertInto('ping')
    .values(data)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function update(id: string, data: PingUpdate): Promise<Ping> {
  const db = getTransaction<DB>();
  return db
    .updateTable('ping')
    .set(data)
    .where('id', '=', Number(id))
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function remove(id: string): Promise<void> {
  const db = getTransaction<DB>();
  await db.deleteFrom('ping').where('id', '=', Number(id)).execute();
}
`;
}

function generateByoPingRepo(): string {
  return `/**
 * TODO: Implement database operations
 *
 * This file contains placeholder implementations.
 * Replace with your actual database queries using your chosen database client.
 */

export interface Ping {
  id: number;
  message: string;
  created_by: string;
  created_at: Date;
}

export interface PingFilters {
  search?: string;
}

// In-memory store for demo purposes - replace with actual database
const pings: Map<number, Ping> = new Map();
let nextId = 1;

export async function findAll(
  limit: number,
  page: number,
  filters: PingFilters
): Promise<Ping[]> {
  // TODO: Replace with actual database query
  let all = Array.from(pings.values());

  // Apply filters
  if (filters.search) {
    all = all.filter((p) => p.message.includes(filters.search!));
  }

  // Sort by created_at desc
  all.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

  // Paginate
  const offset = (page - 1) * (limit - 1); // -1 because we fetch N+1 for hasMore
  return all.slice(offset, offset + limit);
}

export async function count(filters: PingFilters): Promise<number> {
  // TODO: Replace with actual database COUNT query
  let all = Array.from(pings.values());
  if (filters.search) {
    all = all.filter((p) => p.message.includes(filters.search!));
  }
  return all.length;
}

export async function findById(id: string): Promise<Ping | undefined> {
  // TODO: Replace with actual database query
  return pings.get(Number(id));
}

export async function create(data: { message: string; created_by: string }): Promise<Ping> {
  // TODO: Replace with actual database insert
  const ping: Ping = {
    id: nextId++,
    message: data.message,
    created_by: data.created_by,
    created_at: new Date(),
  };
  pings.set(ping.id, ping);
  return ping;
}

export async function update(id: string, data: { message?: string }): Promise<Ping> {
  // TODO: Replace with actual database update
  const numId = Number(id);
  const existing = pings.get(numId);
  if (!existing) {
    throw new Error('Not found');
  }
  const updated = { ...existing, ...data };
  pings.set(numId, updated);
  return updated;
}

export async function remove(id: string): Promise<void> {
  // TODO: Replace with actual database delete
  pings.delete(Number(id));
}
`;
}
