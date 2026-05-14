// @code-block-start: open-routes
// Hover any identifier to see its type
import { createRouter } from 'fossyl';

const router = createRouter();

router.createEndpoint('/health').get({
  handler: async () => {
    return { typeName: 'Health', status: 'ok' };
  },
});

router.createEndpoint('/search').get({
  queryValidator: (data) => data as { q: string; limit?: number },
  handler: async ({ url, query }) => {
    return { typeName: 'SearchResults', results: [], query: query.q };
  },
});
// @code-block-end: open-routes
