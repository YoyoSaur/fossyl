import { db } from '@db';
import type { Ping, NewPing, PingUpdate } from '../../types/db';
import type { PingData } from './ping.types';

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

export async function countByUser(userId: string): Promise<number> {
  const [{ count }] = await db
    .selectFrom('ping')
    .select(db.fn.countAll<number>().as('count'))
    .where('created_by', '=', userId)
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
  const now = new Date();
  const { insertId } = await db
    .insertInto('ping')
    .values({ ...data, created_at: now })
    .executeTakeFirst();
  return { id: Number(insertId), ...data, created_at: now } as unknown as Ping;
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
