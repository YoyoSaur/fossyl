import type { PaginationParams } from '@fossyl/core';
import * as todoRepo from '../repo/todos.repo';

export type { Todo, TodoFilters } from '../repo/todos.repo';

export interface TodoListResult {
  data: todoRepo.Todo[];
  hasMore: boolean;
  total?: number;
}

export async function listTodos(
  pagination: PaginationParams,
  filters: todoRepo.TodoFilters,
): Promise<TodoListResult> {
  const results = await todoRepo.findAll(pagination.pageSize + 1, pagination.page, filters);
  const hasMore = results.length > pagination.pageSize;
  const data = hasMore ? results.slice(0, pagination.pageSize) : results;
  const total = await todoRepo.count?.(filters);
  return { data, hasMore, total };
}

export async function getTodo(id: string): Promise<todoRepo.Todo> {
  const todo = await todoRepo.findById(id);
  if (!todo) throw new Error('Todo not found');
  return todo;
}

export async function createTodo(
  title: string,
): Promise<todoRepo.Todo> {
  return todoRepo.create({ title, userId: '1' });
}

export async function updateTodo(
  id: string,
  data: { title?: string; completed?: boolean },
): Promise<todoRepo.Todo> {
  const existing = await todoRepo.findById(id);
  if (!existing) throw new Error('Todo not found');
  return todoRepo.update(id, data);
}

export async function deleteTodo(id: string): Promise<void> {
  await todoRepo.remove(id);
}
