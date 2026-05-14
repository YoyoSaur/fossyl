// @code-block-start: full-routes
// Hover any identifier to see its type
import { createRouter, authWrapper, bodyWrapper } from 'fossyl';

const router = createRouter();

router.createEndpoint('/posts').post({
  authenticator: async (headers) => {
    return authWrapper({ userId: headers['x-user-id'] });
  },
  validator: (data) => {
    const { title, content } = data as { title: string; content: string };
    if (!title) throw new Error('Title required');
    return bodyWrapper({ title, content });
  },
  handler: async ({ url }, auth, body) => {
    return { typeName: 'PostCreated', id: 'new-id', ...body };
  },
});
// @code-block-end: full-routes
