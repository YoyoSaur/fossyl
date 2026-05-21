import { createRouter } from "@fossyl/core";
import type { PaginatedResponse } from "@fossyl/core";
import * as todoService from "../services/todos.service";
import { authenticator } from "../../../auth";
import { createTodoValidator, updateTodoValidator } from "../validators/todos.validators";

const router = createRouter("/api/todos");

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

export const getTodo = router
  .createEndpoint("/api/todos/:id")
  .authenticator(authenticator)
  .get((params) => (auth) => async () => {
    const todo = await todoService.getTodo(Number(params.url.id));
    return { typeName: "Todo" as const, ...todo };
  });

export const createTodo = router
  .createEndpoint("/api/todos")
  .authenticator(authenticator)
  .validator(createTodoValidator)
  .post((auth) => (body) => async () => {
    const todo = await todoService.createTodo(body.title);
    return { typeName: "Todo" as const, ...todo };
  });

export const updateTodo = router
  .createEndpoint("/api/todos/:id")
  .authenticator(authenticator)
  .validator(updateTodoValidator)
  .put((params) => (auth) => (body) => async () => {
    const todo = await todoService.updateTodo(Number(params.url.id), body);
    return { typeName: "Todo" as const, ...todo };
  });

export const deleteTodo = router
  .createEndpoint("/api/todos/:id")
  .authenticator(authenticator)
  .delete((params) => (auth) => async () => {
    await todoService.deleteTodo(Number(params.url.id));
    return { typeName: "DeleteResult" as const, id: params.url.id, deleted: true };
  });

export default [listTodos, getTodo, createTodo, updateTodo, deleteTodo];
