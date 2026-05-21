import { db } from "@fossyl/kysely";

export type TodoRow = {
  id: number;
  title: string;
  completed: number;
  created_at: string;
};

export async function listTodos(limit: number, offset: number): Promise<TodoRow[]> {
  return db
    .selectFrom("todos")
    .selectAll()
    .orderBy("created_at", "desc")
    .limit(limit)
    .offset(offset)
    .execute();
}

export async function countTodos(): Promise<number> {
  const [{ count }] = await db
    .selectFrom("todos")
    .select(db.fn.countAll<number>().as("count"))
    .execute();
  return count;
}

export async function getTodo(id: number): Promise<TodoRow> {
  const todo = await db.selectFrom("todos").selectAll().where("id", "=", id).executeTakeFirst();

  if (!todo) throw new Error("Todo not found");
  return todo;
}

export async function createTodo(title: string): Promise<TodoRow> {
  const now = new Date().toISOString();

  const { insertId } = await db
    .insertInto("todos")
    .values({ title, completed: 0, created_at: now })
    .executeTakeFirst();

  return { id: Number(insertId), title, completed: 0, created_at: now };
}

export async function updateTodo(
  id: number,
  data: { title?: string; completed?: boolean }
): Promise<TodoRow> {
  const existing = await getTodo(id);

  const updated: Record<string, string | number> = {};
  if (data.title !== undefined) updated.title = data.title;
  if (data.completed !== undefined) updated.completed = data.completed ? 1 : 0;

  await db.updateTable("todos").set(updated).where("id", "=", id).execute();

  return { ...existing, ...updated } as TodoRow;
}

export async function deleteTodo(id: number): Promise<void> {
  await db.deleteFrom("todos").where("id", "=", id).execute();
}
