// @code-block-start: basic-usage
// Hover any identifier to see its type
import { createRouter } from "@fossyl/core";

const router = createRouter<"/api">("/api");

const _userRoute = router
  .createEndpoint("/api/users/:id")
  .get(({ url }) => async () => {
    const userId = url.id;
    return { typeName: "User", id: userId, name: "John Doe" };
  });
// @code-block-end: basic-usage
