// @code-block-start: url-params
// URL params are declared with :param syntax in the path
// Fossyl extracts them at the type level automatically

const getUserRoute = router.createEndpoint('/api/users/:id').get(
  ({ url }) => async () => {
    //    url is typed as: { id: string }
    const userId = url.id;
    return { typeName: 'User' as const, id: userId };
  },
);

// Multiple params work too
const getCommentRoute = router.createEndpoint('/api/posts/:postId/comments/:commentId').get(
  ({ url }) => async () => {
    //    url is typed as: { postId: string; commentId: string }
    return {
      typeName: 'Comment' as const,
      postId: url.postId,
      commentId: url.commentId,
    };
  },
);
// @code-block-end: url-params
