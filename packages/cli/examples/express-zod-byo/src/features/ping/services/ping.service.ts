import * as pingRepo from '../repo/ping.repo';

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

export async function updatePing(id: string, data: { message?: string }, _userId: string): Promise<PingData> {
  return pingRepo.update(id, data);
}

export async function deletePing(id: string, _userId: string): Promise<void> {
  await pingRepo.remove(id);
}
