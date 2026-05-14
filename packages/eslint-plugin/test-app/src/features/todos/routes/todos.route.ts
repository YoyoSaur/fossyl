import { createRouter } from "@fossyl/core";
import type { PaginatedResponse } from "@fossyl/core";
import * as todoService from "../services/todos.service";
import { authenticator } from "../../../auth";

const router = createRouter("/api/todos");

export const listTodos = router.createEndpoint("/api/todos").list({
  paginationConfig: { defaultPageSize: 20, maxPageSize: 100 },
  handler: async ({ pagination }): Promise<PaginatedResponse<todoService.Todo>> => {
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
  },
});

export const getTodo = router.createEndpoint("/api/todos/:id").get({
  handler: async ({ url }, auth) => {
    const todo = await todoService.getTodo(url.id);
    return { typeName: "Todo" as const, ...todo };
  },
});

const todoValidator = (data: unknown) => data as { title: string };

export const createTodo = router.createEndpoint("/api/todos").post({
  authenticator,
  validator: todoValidator,
  handler: async ({ url }, auth, body) => {
    const todo = await todoService.createTodo(body.title);
    return { typeName: "Todo" as const, ...todo };
  },
});

export const updateTodo = router.createEndpoint("/api/todos/:id").put({
  authenticator,
  validator: todoValidator,
  handler: async ({ url }, auth, body) => {
    const todo = await todoService.updateTodo(url.id, body);
    return { typeName: "Todo" as const, ...todo };
  },
});

export const deleteTodo = router.createEndpoint("/api/todos/:id").delete({
  authenticator,
  handler: async ({ url }, auth) => {
    await todoService.deleteTodo(url.id);
    return { typeName: "DeleteResult" as const, id: url.id, deleted: true };
  },
});

export default [listTodos, getTodo, createTodo, updateTodo, deleteTodo];
