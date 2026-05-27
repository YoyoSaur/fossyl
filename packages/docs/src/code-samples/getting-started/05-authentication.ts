// @code-block-start: authentication
// Hover any identifier to see its type
import { createRouter, authWrapper } from "@fossyl/core";

const router = createRouter<"/api">("/api");

const _protectedRoute = router
  .createEndpoint("/api/protected")
  .authenticator(async (headers) => {
    const token = headers["authorization"];
    if (!token) {
      throw new Error("Unauthorized");
    }
    return authWrapper({ userId: "123", role: "admin" });
  })
  .get((auth) => async () => {
    return { typeName: "Message", message: `Hello, user ${auth.userId}` };
  });
// @code-block-end: authentication
