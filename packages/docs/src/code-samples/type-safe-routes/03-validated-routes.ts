// @code-block-start: validated-routes
// Hover any identifier to see its type
import { createRouter } from 'fossyl';

const router = createRouter();

router.createEndpoint('/contact').post({
  validator: (data) => {
    const { name, email } = data as { name: string; email: string };
    if (!name || !email) throw new Error('Name and email required');
    return { name, email };
  },
  handler: async ({ url }, body) => {
    return { typeName: 'MessageSent', ok: true };
  },
});
// @code-block-end: validated-routes
