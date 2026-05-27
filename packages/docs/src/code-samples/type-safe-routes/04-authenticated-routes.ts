// @code-block-start: authenticated-routes
// Hover any identifier to see its type
import { createRouter, authWrapper } from "@fossyl/core";

const router = createRouter<"/api">("/api");

const _userRoute = router
  .createEndpoint("/api/users/:id")
  .authenticator(async (headers) => {
    const userId = headers["x-user-id"];
    if (!userId) throw new Error("Unauthorized");
    return authWrapper({ userId, role: "admin" });
  })
  .get(({ url }) => (_auth) => async () => {
    return { typeName: "UserProfile", id: url.id };
  });
// @code-block-end: authenticated-routes
