// @code-block-start: query-parameters
// Hover any identifier to see its type
import { createRouter } from '@fossyl/core';

const router = createRouter<"/api">("/api");

const searchRoute = router.createEndpoint('/api/search').query(
  (data) => data as { q: string; limit?: number },
).get(
  ({ query }) => async () => {
    return { typeName: 'SearchResults', results: [], query: query.q, limit: query.limit };
  },
);
// @code-block-end: query-parameters
