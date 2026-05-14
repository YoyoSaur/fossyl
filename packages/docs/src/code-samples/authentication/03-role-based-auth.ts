// @code-block-start: role-based-auth
// Compose authenticators for role-based access
import { authWrapper, type Authentication } from 'fossyl';

const requireRole =
  (...roles: string[]) =>
  async (headers: Record<string, string>): Authentication => {
    const token = headers.authorization?.replace('Bearer ', '');
    if (!token) throw new AuthenticationError('Missing token');

    const payload = verifyJwt(token);
    if (!roles.includes(payload.role)) {
      throw new AuthenticationError('Insufficient permissions');
    }

    return authWrapper({ userId: payload.sub, role: payload.role });
  };

// Admin-only route
const adminRoute = router.createEndpoint('/admin/users').get({
  authenticator: requireRole('admin'),
  handler: async ({ url }, auth) => {
    return { typeName: 'AdminPanel' as const, userId: auth.userId };
  },
});

// User-or-admin route
const profileRoute = router.createEndpoint('/profile').get({
  authenticator: requireRole('user', 'admin'),
  handler: async ({ url }, auth) => {
    return { typeName: 'Profile' as const, userId: auth.userId };
  },
});
// @code-block-end: role-based-auth
