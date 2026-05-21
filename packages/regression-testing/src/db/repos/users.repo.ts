import { db } from "@fossyl/kysely";

export type UserRow = {
  id: number;
  name: string;
  email: string;
  created_at: string;
};

export async function getUser(id: number): Promise<UserRow> {
  const user = await db.selectFrom("users").selectAll().where("id", "=", id).executeTakeFirst();

  if (!user) throw new Error("User not found");
  return user;
}

export async function createUser(name: string, email: string): Promise<UserRow> {
  const now = new Date().toISOString();

  const { insertId } = await db
    .insertInto("users")
    .values({ name, email, created_at: now })
    .executeTakeFirst();

  return { id: Number(insertId), name, email, created_at: now };
}

export async function updateUser(
  id: number,
  data: { name?: string; email?: string }
): Promise<UserRow> {
  const existing = await getUser(id);

  const updated: Record<string, string> = {};
  if (data.name !== undefined) updated.name = data.name;
  if (data.email !== undefined) updated.email = data.email;

  await db.updateTable("users").set(updated).where("id", "=", id).execute();

  return { ...existing, ...updated } as UserRow;
}

export async function deleteUser(id: number): Promise<void> {
  await db.deleteFrom("users").where("id", "=", id).execute();
}
