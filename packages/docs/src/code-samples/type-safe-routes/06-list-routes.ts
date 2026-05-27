// @code-block-start: list-routes
// Hover any identifier to see its type
import { createRouter, authWrapper } from "@fossyl/core";

const router = createRouter<"/api">("/api");

router
  .createEndpoint("/api/users")
  .paginate({
    defaultPageSize: 20,
    maxPageSize: 100,
  })
  .get(({ pagination }) => async () => {
    return {
      data: [{ typeName: "User", id: "1", name: "Alice" }],
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        hasMore: false,
      },
    };
  });

router
  .createEndpoint("/api/admin/users")
  .query((data) => data as { role?: string })
  .paginate({
    defaultPageSize: 50,
    maxPageSize: 200,
  })
  .authenticator(async (headers) => authWrapper({ role: headers["x-role"] }))
  .get(({ query: _query, pagination }) => (_auth) => async () => {
    return {
      data: [],
      pagination: { page: pagination.page, pageSize: pagination.pageSize, hasMore: false },
    };
  });
// @code-block-end: list-routes
