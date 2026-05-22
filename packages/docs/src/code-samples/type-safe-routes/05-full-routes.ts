// @code-block-start: full-routes
// Hover any identifier to see its type
import { createRouter, authWrapper } from '@fossyl/core';

const router = createRouter<"/api">("/api");

router.createEndpoint('/api/posts').authenticator(
  async (headers) => {
    return authWrapper({ userId: headers['x-user-id'] });
  },
).validator((data) => {
  const { title, content } = data as { title: string; content: string };
  if (!title) throw new Error('Title required');
  return { title, content };
}).post(
  (auth) => (body) => async () => {
    return { typeName: 'PostCreated', id: 'new-id', ...body };
  },
);
// @code-block-end: full-routes
