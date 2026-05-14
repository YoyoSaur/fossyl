// @code-block-start: type-safety
// Hover any identifier to see its type
import { createRouter } from 'fossyl';

const router = createRouter();

const route = router.createEndpoint('/posts/:postId/comments/:commentId').get({
  handler: async ({ url }) => {
    return { postId: url.postId, commentId: url.commentId };
  },
});
// @code-block-end: type-safety
