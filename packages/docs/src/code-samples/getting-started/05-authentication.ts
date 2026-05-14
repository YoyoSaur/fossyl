// @code-block-start: authentication
// Hover any identifier to see its type
import { createRouter } from 'fossyl';

const router = createRouter();

const protectedRoute = router.createEndpoint('/protected').get({
  authenticator: async (headers) => {
    const token = headers['authorization'];
    if (!token) {
      throw new Error('Unauthorized');
    }
    return { userId: '123', role: 'admin' };
  },
  handler: async ({ url }, auth) => {
    return { message: `Hello, user ${auth.userId}` };
  },
});
// @code-block-end: authentication
