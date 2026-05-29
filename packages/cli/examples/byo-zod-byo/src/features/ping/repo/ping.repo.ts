export interface Ping {
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
  const ping: Ping = { id: nextId++, message: data.message, created_by: data.created_by, created_at: new Date().toISOString() };
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
