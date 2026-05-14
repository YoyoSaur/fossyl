// VIOLATION: no-mixed-prefixes
// This file uses multiple createRouter() calls with different prefixes.
// Expected warning: "File uses multiple router prefixes..."

import { createRouter } from '@fossyl/core';

const todosRouter = createRouter('/api/todos');
const usersRouter = createRouter('/api/users');

export const listTodos = todosRouter.createEndpoint('/api/todos').get({
  handler: async () => {
    return { typeName: 'TodoList' as const, todos: [] };
  },
});

export const listUsers = usersRouter.createEndpoint('/api/users').get({
  handler: async () => {
    return { typeName: 'UserList' as const, users: [] };
  },
});
