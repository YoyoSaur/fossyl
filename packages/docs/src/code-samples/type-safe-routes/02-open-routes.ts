// @code-block-start: open-routes
// Hover any identifier to see its type
import { createRouter } from '@fossyl/core';

const router = createRouter<"/api">("/api");

router.createEndpoint('/api/health').get(
  async () => {
    return { typeName: 'Health', status: 'ok' };
  },
);

router.createEndpoint('/api/search').query(
  (data) => data as { q: string; limit?: number },
).get(
  ({ query }) => async () => {
    return { typeName: 'SearchResults', results: [], query: query.q };
  },
);
// @code-block-end: open-routes
