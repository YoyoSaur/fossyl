import type { ProjectOptions } from "../../prompts";

export function generatePingRoute(options: ProjectOptions): string {
  const validatorImport =
    options.validator === "zod"
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

const router = createRouter('/ping');

export const listPings = router
  .createEndpoint('/ping')
  .query(listPingQueryValidator)
  .paginate({ defaultPageSize: 20, maxPageSize: 100 })
  .get(
    (params) =>
      async (): Promise<PaginatedResponse<pingService.PingData>> => {
        const result = await pingService.listPings(params.pagination, params.query);
        return {
          data: result.data,
          pagination: {
            page: params.pagination.page,
            pageSize: params.pagination.pageSize,
            hasMore: result.hasMore,
            total: result.total,
          },
        };
      }
  );

export const getPing = router
  .createEndpoint('/ping/:id')
  .get((params) => async () => {
    const ping = await pingService.getPing(params.url.id);
    return { typeName: 'Ping' as const, ...ping };
  });

export const createPing = router
  .createEndpoint('/ping')
  .authenticator(authenticator)
  .validator(createPingValidator)
  .post((auth) => (body) => async () => {
    const ping = await pingService.createPing(body.message, auth.userId);
    return { typeName: 'Ping' as const, ...ping };
  });

export const updatePing = router
  .createEndpoint('/ping/:id')
  .authenticator(authenticator)
  .validator(updatePingValidator)
  .put((params) => (auth) => (body) => async () => {
    const ping = await pingService.updatePing(params.url.id, body, auth.userId);
    return { typeName: 'Ping' as const, ...ping };
  });

export const deletePing = router
  .createEndpoint('/ping/:id')
  .authenticator(authenticator)
  .delete((params) => (auth) => async () => {
    await pingService.deletePing(params.url.id, auth.userId);
    return { typeName: 'DeleteResult' as const, id: params.url.id, deleted: true };
  });

export default [listPings, getPing, createPing, updatePing, deletePing];
`;
}

export function generatePingService(_options: ProjectOptions): string {
  return `import * as pingRepo from '../repo/ping.repo';

export type PingData = {
  id: number;
  message: string;
  created_by: string;
  created_at: string;
};

export async function listPings(
  pagination: { page: number; pageSize: number },
  _filters?: { search?: string }
) {
  const offset = (pagination.page - 1) * pagination.pageSize;
  const [rows, total] = await Promise.all([
    pingRepo.findAll(pagination.pageSize + 1, offset),
    pingRepo.countAll(),
  ]);

  const hasMore = rows.length > pagination.pageSize;

  return {
    data: hasMore ? rows.slice(0, pagination.pageSize) : rows,
    hasMore,
    total,
  };
}

export async function getPing(id: string): Promise<PingData> {
  const ping = await pingRepo.findById(id);
  if (!ping) throw new Error('Ping not found');
  return ping;
}

export async function createPing(message: string, userId: string): Promise<PingData> {
  return pingRepo.create({ message, created_by: userId });
}

export async function updatePing(
  id: string,
  data: { message?: string },
  _userId: string
): Promise<PingData> {
  return pingRepo.update(id, data);
}

export async function deletePing(id: string, _userId: string): Promise<void> {
  await pingRepo.remove(id);
}
`;
}

export function generatePingRepo(options: ProjectOptions): string {
  if (options.database === "kysely") {
    return generateKyselyPingRepo();
  }
  return generateByoPingRepo();
}

function generateKyselyPingRepo(): string {
  return `import { db } from '@db';
import type { Ping, NewPing, PingUpdate } from '../../../types/db';

export type PingRow = Ping;

export async function findAll(limit: number, offset: number): Promise<Ping[]> {
  return db
    .selectFrom('ping')
    .selectAll()
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset)
    .execute();
}

export async function countAll(): Promise<number> {
  const [{ count }] = await db
    .selectFrom('ping')
    .select(db.fn.countAll<number>().as('count'))
    .execute();
  return count;
}

export async function findById(id: string): Promise<Ping | undefined> {
  return db
    .selectFrom('ping')
    .selectAll()
    .where('id', '=', Number(id))
    .executeTakeFirst();
}

export async function create(data: Omit<NewPing, 'id' | 'created_at'>): Promise<Ping> {
  const now = new Date().toISOString();
  const { insertId } = await db
    .insertInto('ping')
    .values({ ...data, created_at: now })
    .executeTakeFirst();
  return { id: Number(insertId), ...data, created_at: now } as Ping;
}

export async function update(id: string, data: PingUpdate): Promise<Ping> {
  const existing = await findById(id);
  if (!existing) throw new Error('Ping not found');

  const updated: Record<string, string | number> = {};
  if (data.message !== undefined) updated.message = data.message;

  await db.updateTable('ping').set(updated).where('id', '=', Number(id)).execute();

  return { ...existing, ...updated } as Ping;
}

export async function remove(id: string): Promise<void> {
  await db.deleteFrom('ping').where('id', '=', Number(id)).execute();
}
`;
}

function generateByoPingRepo(): string {
  return `export interface Ping {
  id: number;
  message: string;
  created_by: string;
  created_at: string;
}

const pings: Map<number, Ping> = new Map();
let nextId = 1;

export async function findAll(limit: number, offset: number): Promise<Ping[]> {
  return Array.from(pings.values())
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(offset, offset + limit);
}

export async function countAll(): Promise<number> {
  return pings.size;
}

export async function findById(id: string): Promise<Ping | undefined> {
  return pings.get(Number(id));
}

export async function create(data: { message: string; created_by: string }): Promise<Ping> {
  const ping: Ping = {
    id: nextId++,
    message: data.message,
    created_by: data.created_by,
    created_at: new Date().toISOString(),
  };
  pings.set(ping.id, ping);
  return ping;
}

export async function update(id: string, data: { message?: string }): Promise<Ping> {
  const numId = Number(id);
  const existing = pings.get(numId);
  if (!existing) throw new Error('Not found');
  const updated = { ...existing, ...data };
  pings.set(numId, updated);
  return updated;
}

export async function remove(id: string): Promise<void> {
  pings.delete(Number(id));
}
`;
}
