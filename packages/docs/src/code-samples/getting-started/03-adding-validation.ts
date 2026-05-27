// @code-block-start: adding-validation
// Hover any identifier to see its type
import { createRouter } from "@fossyl/core";

const router = createRouter<"/api">("/api");

const _createUserRoute = router
  .createEndpoint("/api/users")
  .validator((data) => {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid body");
    }
    const { name, email } = data as { name?: unknown; email?: unknown };
    if (typeof name !== "string" || typeof email !== "string") {
      throw new Error("Name and email must be strings");
    }
    return { name, email };
  })
  .post((body) => async () => {
    return { typeName: "User", id: "123", ...body };
  });
// @code-block-end: adding-validation
