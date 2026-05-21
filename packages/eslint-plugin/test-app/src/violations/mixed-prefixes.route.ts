// VIOLATION: no-mixed-prefixes
// This file uses multiple createRouter() calls with different prefixes.
// Expected warning: "File uses multiple router prefixes..."

import { createRouter } from "@fossyl/core";

const todosRouter = createRouter("/api/todos");
const usersRouter = createRouter("/api/users");

export const listTodos = todosRouter
  .createEndpoint("/api/todos")
  .get(async () => ({ typeName: "TodoList" as const, todos: [] }));

export const listUsers = usersRouter
  .createEndpoint("/api/users")
  .get(async () => ({ typeName: "UserList" as const, users: [] }));
