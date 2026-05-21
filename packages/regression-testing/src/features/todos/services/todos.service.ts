import * as todoRepo from "../../../db/repos/todos.repo";

export async function listTodos(pagination: { page: number; pageSize: number }) {
  const offset = (pagination.page - 1) * pagination.pageSize;
  const [rows, total] = await Promise.all([
    todoRepo.listTodos(pagination.pageSize + 1, offset),
    todoRepo.countTodos(),
  ]);

  const hasMore = rows.length > pagination.pageSize;

  return {
    data: hasMore ? rows.slice(0, pagination.pageSize) : rows,
    hasMore,
    total,
  };
}

export async function getTodo(id: number) {
  return todoRepo.getTodo(id);
}

export async function createTodo(title: string) {
  return todoRepo.createTodo(title);
}

export async function updateTodo(id: number, data: { title?: string; completed?: boolean }) {
  return todoRepo.updateTodo(id, data);
}

export async function deleteTodo(id: number) {
  return todoRepo.deleteTodo(id);
}
