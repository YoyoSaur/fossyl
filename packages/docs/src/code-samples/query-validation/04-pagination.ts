// @code-block-start: pagination
// Paginated routes automatically handle pagination params:
//   ?page=1&pageSize=20  →  { page: 1, pageSize: 20 }
import { createRouter } from "@fossyl/core";

const router = createRouter<"/api">("/api");

const _listPostsRoute = router
  .createEndpoint("/api/posts")
  .paginate({
    defaultPageSize: 20,
    maxPageSize: 100,
  })
  .get(({ pagination }) => async () => {
    //    pagination is typed as: { page: number; pageSize: number }
    const { page, pageSize } = pagination;

    // N+1 trick: fetch one extra to determine hasMore
    const items = await db
      .selectFrom("posts")
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
  });

// Authenticated list routes work too
const _listMyPostsRoute = router
  .createEndpoint("/api/my-posts")
  .paginate({
    defaultPageSize: 20,
    maxPageSize: 100,
  })
  .authenticator(myAuth)
  .get(({ pagination }) => (auth) => async () => {
    const items = await db
      .selectFrom("posts")
      .where("userId", "=", auth.userId)
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
  });
// @code-block-end: pagination
