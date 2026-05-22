// @code-block-start: type-safety
// Hover any identifier to see its type
import { createRouter } from '@fossyl/core';

const router = createRouter<"/api">("/api");

const route = router.createEndpoint('/api/posts/:postId/comments/:commentId').get(
  ({ url }) => async () => {
    return { typeName: 'Comment', postId: url.postId, commentId: url.commentId };
  },
);
// @code-block-end: type-safety
