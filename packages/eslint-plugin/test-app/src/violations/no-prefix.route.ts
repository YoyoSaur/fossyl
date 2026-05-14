// VIOLATION: path-prefix-convention
// Route paths must start with /api/ (the configured prefix).
// Expected warning: "Route path '/todos' should start with one of the following prefixes: /api/."

import { createRouter } from '@fossyl/core';

const router = createRouter('/todos');

export const listTodos = router.createEndpoint('/todos').get({
  handler: async () => {
    return { typeName: 'TodoList' as const, todos: [] };
  },
});

export const getTodo = router.createEndpoint('/todos/:id').get({
  handler: async ({ url }) => {
    return { typeName: 'Todo' as const, id: url.id };
  },
});
