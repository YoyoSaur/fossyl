import { createRouter } from "./router/router";
import { authWrapper } from "./router/types/routes.types";

import { zodQueryValidator, zodValidator } from "../../zod/src/index";
import { z } from "../../zod/node_modules/zod";

const authenticationMiddleware = async (headers: Record<string, string>) => {
  // Simulate async auth (e.g., OAuth, database lookup, JWT verification)
  return authWrapper({
    status: headers.authorization,
  });
};

const baseRouter = createRouter("/status");
const endpoint = baseRouter.createEndpoint("/status");

const _getter = endpoint.post({
  authenticator: authenticationMiddleware,
  handler: async (_params) => {
    return {
      typeName: "StatusResponse" as const,
      status: "ok",
    };
  },
});

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Query parameter "q" is required'),
});

const x = zodQueryValidator(searchQuerySchema);

const bodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

// Test: zodValidator inline with full inference
const _poster = endpoint.post({
  validator: zodValidator(bodySchema),
  handler: async (args) => {
    // If inference works, these should typecheck:
    const name: string = body.name;
    const email: string = body.email;
    const q: string = _params.query.q;
    // @ts-expect-error - notAField doesn't exist on body
    body.notAField;
    // @ts-expect-error - notAField doesn't exist on query
    _params.query.notAField;
    return {
      typeName: "StatusResponse" as const,
      status: "ok",
    };
  },
});
