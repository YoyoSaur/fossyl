// @code-block-start: url-params
// Hover any identifier to see its type
import { createRouter } from "@fossyl/core";

const router = createRouter<"/api">("/api");

const _userRoute = router
  .createEndpoint("/api/users/:id")
  .get(({ url }) => async () => {
    return { typeName: "User", id: url.id, name: "John Doe" };
  });

router
  .createEndpoint("/api/posts/:postId/comments/:commentId")
  .get(({ url }) => async () => {
    return { typeName: "Comment", postId: url.postId, commentId: url.commentId };
  });
// @code-block-end: url-params
