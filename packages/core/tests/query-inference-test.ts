import { createRouter, authWrapper } from '../src';

const router = createRouter('/api');
const endpoint = router.createEndpoint('/test');

// Inline validator - does this infer correctly?
const queryValidator = (data: unknown): { q: string; limit?: number } => {
  return data as { q: string; limit?: number };
};

const route = endpoint.get({
  queryValidator,
  handler: async ({ url, query }) => {
    // This should work if Query is inferred as { q: string; limit?: number }
    const q: string = query.q;
    const limit: number | undefined = query.limit;
    return { typeName: 'Test' as const, q, limit };
  }
});

// Also test with authenticator
const authenticator = async (headers: Record<string, string>) => 
  authWrapper({ userId: headers['x-user-id'] || '' });

const authRoute = endpoint.get({
  authenticator,
  queryValidator,
  handler: async ({ url, query }, auth) => {
    const q: string = query.q;  // Should work
    return { typeName: 'Test' as const, q, userId: auth.userId };
  }
});

export { route, authRoute };
