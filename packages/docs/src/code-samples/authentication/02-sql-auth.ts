// @code-block-start: sql-auth
// SQL-based authentication — look up user in database
import { authWrapper } from "@fossyl/core";
import { AuthenticationError, getDb } from "@fossyl/express";
import { createRouter } from "@fossyl/core";

const router = createRouter<"/api">("/api");

const sqlAuth = async (headers: Record<string, string>) => {
  const apiKey = headers["x-api-key"];
  if (!apiKey) throw new AuthenticationError("API key required");

  const db: any = getDb().client;
  const user = await db
    .selectFrom("users")
    .where("api_key", "=", apiKey)
    .select(["id", "role", "name"])
    .executeTakeFirst();

  if (!user) throw new AuthenticationError("Invalid API key");

  return authWrapper({
    userId: user.id,
    role: user.role,
    name: user.name,
  });
};

const _protectedRoute = router
  .createEndpoint("/api/dashboard")
  .authenticator(sqlAuth)
  .get((auth) => async () => {
    //    auth is typed as: { userId: string; role: string; name: string }
    return {
      typeName: "Dashboard" as const,
      user: auth.name,
      role: auth.role,
    };
  });
// @code-block-end: sql-auth
