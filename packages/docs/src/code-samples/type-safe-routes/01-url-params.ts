// @code-block-start: url-params
// Hover any identifier to see its type
import { createRouter } from 'fossyl';

const router = createRouter();

const userRoute = router.createEndpoint('/users/:id').get({
  handler: async ({ url }) => {
    return { typeName: 'User', id: url.id, name: 'John Doe' };
  },
});

router.createEndpoint('/posts/:postId/comments/:commentId').get({
  handler: async ({ url }) => {
    return { typeName: 'Comment', postId: url.postId, commentId: url.commentId };
  },
});
// @code-block-end: url-params
