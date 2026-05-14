// @code-block-start: basic-usage
// Hover any identifier to see its type
import { createRouter } from 'fossyl';

const router = createRouter();

const userRoute = router.createEndpoint('/users/:id').get({
  handler: async ({ url }) => {
    const userId = url.id;
    return { id: userId, name: 'John Doe' };
  },
});
// @code-block-end: basic-usage
