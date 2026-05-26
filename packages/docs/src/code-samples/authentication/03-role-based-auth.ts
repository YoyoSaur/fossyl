// @code-block-start: role-based-auth
// Compose authenticators for role-based access
import { authWrapper, type Authentication } from '@fossyl/core';

import { createRouter } from '@fossyl/core';

const router = createRouter<"/api">("/api");

const requireRole =
  (...roles: string[]) =>
  async (headers: Record<string, string>) => {
    const token = headers.authorization?.replace('Bearer ', '');
    if (!token) throw new AuthenticationError('Missing token');

    const payload = verifyJwt(token);
    if (!roles.includes(payload.role)) {
      throw new AuthenticationError('Insufficient permissions');
    }

    return authWrapper({ userId: payload.sub, role: payload.role });
  };

// Admin-only route
const adminRoute = router.createEndpoint('/api/admin/users').authenticator(
  requireRole('admin'),
).get(
  (auth) => async () => {
    return { typeName: 'AdminPanel' as const, userId: auth.userId };
  },
);

// User-or-admin route
const profileRoute = router.createEndpoint('/api/profile').authenticator(
  requireRole('user', 'admin'),
).get(
  (auth) => async () => {
    return { typeName: 'Profile' as const, userId: auth.userId };
  },
);
// @code-block-end: role-based-auth
