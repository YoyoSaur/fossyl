// @code-block-start: role-based-auth
// Compose authenticators for role-based access
import { authWrapper, fossylUnauthorized } from "@fossyl/core";

import { createRouter } from "@fossyl/core";

const router = createRouter<"/api">("/api");

const requireRole =
  (...roles: string[]) =>
  async (headers: Record<string, string>) => {
    const token = headers.authorization?.replace("Bearer ", "");
    if (!token) throw fossylUnauthorized("Missing token");

    const payload = verifyJwt(token);
    if (!roles.includes(payload.role)) {
      throw fossylUnauthorized("Insufficient permissions");
    }

    return authWrapper({ userId: payload.sub, role: payload.role });
  };

// Admin-only route
const _adminRoute = router
  .createEndpoint("/api/admin/users")
  .authenticator(requireRole("admin"))
  .get((auth) => async () => {
    return { typeName: "AdminPanel" as const, userId: auth.userId };
  });

// User-or-admin route
const _profileRoute = router
  .createEndpoint("/api/profile")
  .authenticator(requireRole("user", "admin"))
  .get((auth) => async () => {
    return { typeName: "Profile" as const, userId: auth.userId };
  });
// @code-block-end: role-based-auth
