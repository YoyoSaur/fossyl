import { createRouter } from "@fossyl/core";
import type { PaginatedResponse } from "@fossyl/core";
import * as todoService from "../services/todos.service";
import { authenticator } from "../../../auth";
import { createTodoValidator, updateTodoValidator } from "../validators/todos.validators";

const router = createRouter("/api/todos");

// @code: start paginate-list-todos
export const listTodos = router
  .createEndpoint("/api/todos")
  .paginate({ defaultPageSize: 20, maxPageSize: 100 })
  .get((params) => async (): Promise<PaginatedResponse<{ typeName: "Todo"; id: number }>> => {
    const result = await todoService.listTodos(params.pagination);
    return {
      data: result.data.map((t) => ({ typeName: "Todo" as const, id: t.id })),
      pagination: {
        page: params.pagination.page,
        pageSize: params.pagination.pageSize,
        hasMore: result.hasMore,
        total: result.total,
      },
    };
  });
// @code: end paginate-list-todos

// @code: start auth-get-todo
export const getTodo = router
  .createEndpoint("/api/todos/:id")
  .authenticator(authenticator)
  .get((params) => (auth) => async () => {
    const todo = await todoService.getTodo(Number(params.url.id));
    return { typeName: "Todo" as const, ...todo };
  });
// @code: end auth-get-todo

// @code: start auth-validator-post-todo
export const createTodo = router
  .createEndpoint("/api/todos")
  .authenticator(authenticator)
  .validator(createTodoValidator)
  .post((auth) => (body) => async () => {
    const todo = await todoService.createTodo(body.title);
    return { typeName: "Todo" as const, ...todo };
  });
// @code: end auth-validator-post-todo

// @code: start auth-validator-put-todo
export const updateTodo = router
  .createEndpoint("/api/todos/:id")
  .authenticator(authenticator)
  .validator(updateTodoValidator)
  .put((params) => (auth) => (body) => async () => {
    const todo = await todoService.updateTodo(Number(params.url.id), body);
    return { typeName: "Todo" as const, ...todo };
  });
// @code: end auth-validator-put-todo

// @code: start auth-delete-todo
export const deleteTodo = router
  .createEndpoint("/api/todos/:id")
  .authenticator(authenticator)
  .delete((params) => (auth) => async () => {
    await todoService.deleteTodo(Number(params.url.id));
    return { typeName: "DeleteResult" as const, id: params.url.id, deleted: true };
  });
// @code: end auth-delete-todo

// @code: start search-todos
export const searchTodos = router
  .createEndpoint("/api/todos/search")
  .query((data): { q: string; limit?: number; offset?: number } => {
    const params = data as Record<string, string | undefined>;
    if (!params.q || params.q.trim() === "") {
      throw new Error('Search query "q" is required');
    }
    return {
      q: params.q,
      limit: params.limit ? Number(params.limit) : undefined,
      offset: params.offset ? Number(params.offset) : undefined,
    };
  })
  .get(({ query }) => async () => {
    return { typeName: "SearchResult" as const, q: query.q, limit: query.limit, offset: query.offset };
  });
// @code: end search-todos

export default [listTodos, getTodo, createTodo, updateTodo, deleteTodo];
