// @code-block-start: custom-auth
// Authentication is just an async function that returns authWrapper()
import { authWrapper, createRouter } from "@fossyl/core";

const router = createRouter<"/api">("/api");

// JWT-based auth
const jwtAuth = async (headers: Record<string, string>) => {
  const token = headers.authorization?.replace("Bearer ", "");
  if (!token) throw new AuthenticationError("Missing authorization token");

  const payload = verifyJwt(token);
  return authWrapper({
    userId: payload.sub,
    role: payload.role as "admin" | "user",
  });
};

// Use in routes — auth type is inferred
const _protectedRoute = router
  .createEndpoint("/api/profile")
  .authenticator(jwtAuth)
  .get((auth) => async () => {
    //    auth is typed as: { userId: string; role: 'admin' | 'user' }
    return { typeName: "Profile" as const, id: auth.userId, role: auth.role };
  });
// @code-block-end: custom-auth
