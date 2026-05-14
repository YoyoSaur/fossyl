export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  userId: string;
  created_at: Date;
}

export interface TodoFilters {
  completed?: boolean;
  search?: string;
}

const todos: Map<number, Todo> = new Map();
let nextId = 1;

export async function findAll(
  limit: number,
  page: number,
  filters: TodoFilters,
): Promise<Todo[]> {
  let all = Array.from(todos.values());
  if (filters.completed !== undefined) {
    all = all.filter((t) => t.completed === filters.completed);
  }
  if (filters.search) {
    all = all.filter((t) => t.title.includes(filters.search!));
  }
  all.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  const offset = (page - 1) * (limit - 1);
  return all.slice(offset, offset + limit);
}

export async function findById(id: string): Promise<Todo | undefined> {
  return todos.get(Number(id));
}

export async function create(data: { title: string; userId: string }): Promise<Todo> {
  const todo: Todo = {
    id: nextId++,
    title: data.title,
    completed: false,
    userId: data.userId,
    created_at: new Date(),
  };
  todos.set(todo.id, todo);
  return todo;
}

export async function update(
  id: string,
  data: { title?: string; completed?: boolean },
): Promise<Todo> {
  const numId = Number(id);
  const existing = todos.get(numId);
  if (!existing) throw new Error('Not found');
  const updated = { ...existing, ...data };
  todos.set(numId, updated);
  return updated;
}

export async function remove(id: string): Promise<void> {
  todos.delete(Number(id));
}

export async function count(_filters: TodoFilters): Promise<number> {
  return todos.size;
}
