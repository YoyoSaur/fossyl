import { createRouter } from "@fossyl/core";
import type { PaginatedResponse } from "@fossyl/core";
import * as todoService from "../services/todos.service";
import { authenticator } from "../../../auth";

const router = createRouter("/api/todos");

const todoValidator = (data: unknown) => data as { title: string };

export const listTodos = router
  .createEndpoint("/api/todos")
  .paginate({
    defaultPageSize: 20,
    maxPageSize: 100,
  })
  .get(({ pagination }) => async (): Promise<PaginatedResponse<todoService.Todo>> => {
    const result = await todoService.listTodos(pagination, {});
    return {
      data: result.data,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        hasMore: result.hasMore,
        total: result.total,
      },
    };
  });

export const getTodo = router
  .createEndpoint("/api/todos/:id")
  .authenticator(authenticator)
  .get(({ url }) => (auth) => async () => {
    const todo = await todoService.getTodo(url.id);
    return { typeName: "Todo" as const, ...todo };
  });

export const createTodo = router
  .createEndpoint("/api/todos")
  .authenticator(authenticator)
  .validator(todoValidator)
  .post((auth) => (body) => async () => {
    const todo = await todoService.createTodo(body.title);
    return { typeName: "Todo" as const, ...todo };
  });

export const updateTodo = router
  .createEndpoint("/api/todos/:id")
  .authenticator(authenticator)
  .validator(todoValidator)
  .put(({ url }) => (auth) => (body) => async () => {
    const todo = await todoService.updateTodo(url.id, body);
    return { typeName: "Todo" as const, ...todo };
  });

export const deleteTodo = router
  .createEndpoint("/api/todos/:id")
  .authenticator(authenticator)
  .delete(({ url }) => (auth) => async () => {
    await todoService.deleteTodo(url.id);
    return { typeName: "DeleteResult" as const, id: url.id, deleted: true };
  });

export default [listTodos, getTodo, createTodo, updateTodo, deleteTodo];
