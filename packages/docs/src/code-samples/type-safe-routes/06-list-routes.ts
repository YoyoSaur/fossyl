// @code-block-start: list-routes
// Hover any identifier to see its type
import { createRouter, authWrapper } from 'fossyl';

const router = createRouter();

router.createEndpoint('/users').list({
  handler: async ({ url, pagination }) => {
    return {
      data: [{ typeName: 'User', id: '1', name: 'Alice' }],
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        hasMore: false,
      },
    };
  },
});

router.createEndpoint('/admin/users').list({
  authenticator: async (headers) => authWrapper({ role: headers['x-role'] }),
  queryValidator: (data) => data as { role?: string },
  paginationConfig: { defaultPageSize: 50, maxPageSize: 200 },
  handler: async ({ url, query, pagination }, auth) => {
    return {
      data: [],
      pagination: { page: pagination.page, pageSize: pagination.pageSize, hasMore: false },
    };
  },
});
// @code-block-end: list-routes
