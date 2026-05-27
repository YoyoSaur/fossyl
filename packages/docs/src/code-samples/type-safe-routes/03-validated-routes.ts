// @code-block-start: validated-routes
// Hover any identifier to see its type
import { createRouter } from "@fossyl/core";

const router = createRouter<"/api">("/api");

router
  .createEndpoint("/api/contact")
  .validator((data) => {
    const { name, email } = data as { name: string; email: string };
    if (!name || !email) throw new Error("Name and email required");
    return { name, email };
  })
  .post((_body) => async () => {
    return { typeName: "MessageSent", ok: true };
  });
// @code-block-end: validated-routes
