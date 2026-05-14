// @code-block-start: query-parameters
// Hover any identifier to see its type
import { createRouter } from 'fossyl';

const router = createRouter();

const searchRoute = router.createEndpoint('/search').get({
  queryValidator: (data) => {
    return data as { q: string; limit?: number };
  },
  handler: async ({ url, query }) => {
    return { results: [], query: query.q, limit: query.limit };
  },
});
// @code-block-end: query-parameters
