// @code-block-start: pagination
// List routes automatically handle pagination params:
//   ?page=1&pageSize=20  →  { page: 1, pageSize: 20 }

const listPostsRoute = router.createEndpoint('/posts').list({
  paginationConfig: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  handler: async ({ pagination }) => {
    //    pagination is typed as: { page: number; pageSize: number }
    const { page, pageSize } = pagination;

    // N+1 trick: fetch one extra to determine hasMore
    const items = await db
      .selectFrom('posts')
      .limit(pageSize + 1)
      .offset((page - 1) * pageSize)
      .execute();

    const hasMore = items.length > pageSize;

    return {
      data: hasMore ? items.slice(0, pageSize) : items,
      pagination: {
        page,
        pageSize,
        hasMore,
      },
    };
  },
});

// Authenticated list routes work too
const listMyPostsRoute = router.createEndpoint('/my-posts').list({
  authenticator: myAuth,
  handler: async ({ pagination }, auth) => {
    const items = await db
      .selectFrom('posts')
      .where('userId', '=', auth.userId)
      .limit(pagination.pageSize + 1)
      .offset((pagination.page - 1) * pagination.pageSize)
      .execute();

    return {
      data: items.slice(0, pagination.pageSize),
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        hasMore: items.length > pagination.pageSize,
      },
    };
  },
});
// @code-block-end: pagination
