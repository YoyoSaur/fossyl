// @code-block-start: authenticated-routes
// Hover any identifier to see its type
import { createRouter } from 'fossyl';

const router = createRouter();

const userRoute = router.createEndpoint('/users/:id').get({
  authenticator: async (headers) => {
    const userId = headers['x-user-id'];
    if (!userId) throw new Error('Unauthorized');
    return { userId, role: 'admin' };
  },
  handler: async ({ url }, auth) => {
    return { typeName: 'UserProfile', id: url.id };
  },
});
// @code-block-end: authenticated-routes
