// @code-block-start: query-params
// Query params are validated and typed via queryValidator
import { createRouter } from "@fossyl/core";

const router = createRouter<"/api">("/api");

const _searchRoute = router
  .createEndpoint("/api/search")
  .query((data): { q: string; limit?: number; offset?: number } => {
    const params = data as Record<string, string | undefined>;
    if (!params.q || params.q.trim() === "") {
      throw new Error('Search query "q" is required');
    }
    return {
      q: params.q,
      limit: params.limit ? Number(params.limit) : undefined,
      offset: params.offset ? Number(params.offset) : undefined,
    };
  })
  .get(({ query }) => async () => {
    //    query is typed as: { q: string; limit?: number; offset?: number }
    const results = await searchDatabase(query.q, query.limit, query.offset);
    return { typeName: "SearchResult" as const, results };
  });
// @code-block-end: query-params
