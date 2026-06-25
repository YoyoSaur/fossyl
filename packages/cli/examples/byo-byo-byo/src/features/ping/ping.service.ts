import { fossylBadRequest, fossylNotFound } from '@fossyl/core';
import * as pingRepo from './ping.repo';
import type { PingData } from './ping.types';

export type { PingData };

export async function listPings(
  pagination: { page: number; pageSize: number },
  _filters?: { search?: string }
): Promise<{ data: PingData[]; hasMore: boolean; total: number }> {
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
  if (!ping) throw fossylNotFound('Ping not found');
  return ping;
}

export async function getPingOrError(id: string): Promise<PingData> {
  const ping = await pingRepo.findById(id);
  if (!ping) throw fossylNotFound('Ping not found');
  return ping;
}

export async function createPing(message: string, userId: string): Promise<PingData> {
  return pingRepo.create({ message, created_by: userId });
}

export async function renamePing(id: string, data: { message?: string }): Promise<PingData> {
  const ping = await pingRepo.findById(id);
  if (!ping) throw fossylNotFound('Ping not found');
  if (!data.message) throw fossylBadRequest('Message is required to rename ping');
  return pingRepo.update(id, { message: data.message });
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

export async function getPingStats(userId: string): Promise<{ total: number; byUser: number }> {
  const [total, byUser] = await Promise.all([
    pingRepo.countAll(),
    pingRepo.countByUser(userId),
  ]);
  return { total, byUser };
}
