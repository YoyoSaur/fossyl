// VIOLATION: no-duplicate-routes
// This file defines a route that already exists in todos.route.ts (GET /api/todos/:id).
// Expected error: "Duplicate route: GET /api/todos/:id already defined at ..."

import { createRouter } from '@fossyl/core';

const router = createRouter('/api/todos');

export const alsoGetTodo = router.createEndpoint('/api/todos/:id').get({
  handler: async ({ url }) => {
    return { typeName: 'Todo' as const, id: url.id, title: 'duplicate', completed: false };
  },
});
