// VIOLATION: no-repo-import-outside-service
// Route files must NOT import .repo files directly.
// Expected error: "Repository files (*.repo) can only be imported in service files (*.service)."

import * as todoRepo from '../features/todos/repo/todos.repo';
import { createRouter } from '@fossyl/core';

const router = createRouter('/api/violations');

export const badRoute = router.createEndpoint('/api/violations/bad').get({
  handler: async () => {
    const todos = await todoRepo.findAll(10, 1, {});
    return { typeName: 'Bad' as const, todos };
  },
});
