export interface User {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

const users: Map<number, User> = new Map();
let nextId = 1;

export async function findById(id: string): Promise<User | undefined> {
  return users.get(Number(id));
}

export async function findByEmail(email: string): Promise<User | undefined> {
  return Array.from(users.values()).find((u) => u.email === email);
}

export async function create(data: { name: string; email: string }): Promise<User> {
  const user: User = {
    id: nextId++,
    name: data.name,
    email: data.email,
    created_at: new Date(),
  };
  users.set(user.id, user);
  return user;
}

export async function update(id: string, data: { name?: string }): Promise<User> {
  const numId = Number(id);
  const existing = users.get(numId);
  if (!existing) throw new Error('Not found');
  const updated = { ...existing, ...data };
  users.set(numId, updated);
  return updated;
}

export async function remove(id: string): Promise<void> {
  users.delete(Number(id));
}
