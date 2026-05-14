// @code-block-start: query-with-zod
// Query validation with Zod — same pattern as body validation
import { z } from 'zod';
import { zodQueryValidator } from '@fossyl/zod';

const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

const searchRoute = router.createEndpoint('/search').get({
  queryValidator: zodQueryValidator(searchSchema),
  handler: async ({ url, query }) => {
    //    query is typed as: { q: string; limit: number; offset: number }
    return { typeName: 'SearchResult' as const, results: await searchDb(query) };
  },
});
// @code-block-end: query-with-zod
