// VIOLATION: consistent-naming
// File is named 'things.route.ts' but the route prefix is '/api/gadgets'.
// Expected warning: "Route prefix '/api/gadgets' does not match file name 'things.route.ts'..."

import { createRouter } from '@fossyl/core';

const router = createRouter('/api/gadgets');

export const listGadgets = router.createEndpoint('/api/gadgets').get({
  handler: async () => {
    return { typeName: 'GadgetList' as const, gadgets: [] };
  },
});
