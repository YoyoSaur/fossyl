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
const endpoint = baseRouter.createEndpoint("/status/:id");
const searchQuerySchema = z.object({
  q: z.string().min(1, 'Query parameter "q" is required'),
});

const bodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
});
const searchQueryValidator = zodQueryValidator(searchQuerySchema);
const bodyValidator = zodValidator(bodySchema);

endpoint
  .query(searchQueryValidator)
  .paginate({ defaultPageSize: 20, maxPageSize: 100 })
  .authenticator(authenticationMiddleware)
  .validator(bodyValidator)
  .post((body) => (query) => (paginate) => (url) => async () => {
    return {
      typeName: "StatusResponse",
      status: "OK",
      data: {
        auth,
        body,
        query,
        paginate,
        url,
      },
    };
  });
