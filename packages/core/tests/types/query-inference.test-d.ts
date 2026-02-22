// Test that Query type is properly inferred from queryValidator return type
import { createRouter, authWrapper } from '../../src';

const router = createRouter('/api');
const endpoint = router.createEndpoint('/api/test/:id');

// Define a validator with explicit return type
const queryValidator = (data: unknown): { q: string; limit?: number } => {
  return data as { q: string; limit?: number };
};

// Test 1: GET with queryValidator - query should be { q: string; limit?: number }
endpoint.get({
  queryValidator,
  handler: async ({ url, query }) => {
    // These should compile without error if Query is properly inferred
    const q: string = query.q;
    const limit: number | undefined = query.limit;
    return { typeName: 'Test' as const, q, limit };
  }
});

// Test 2: GET with authenticator + queryValidator
const authenticator = async (headers: Record<string, string>) =>
  authWrapper({ userId: headers['x-user-id'] || '' });

endpoint.get({
  authenticator,
  queryValidator,
  handler: async ({ url, query }, auth) => {
    const q: string = query.q;
    return { typeName: 'Test' as const, q, userId: auth.userId };
  }
});

// Test 3: POST with validator - body should be inferred
const bodyValidator = (data: unknown): { name: string; email: string } => {
  return data as { name: string; email: string };
};

endpoint.post({
  validator: bodyValidator,
  handler: async ({ url }, body) => {
    const name: string = body.name;
    const email: string = body.email;
    return { typeName: 'User' as const, name, email };
  }
});

// Test 4: POST with validator + queryValidator + authenticator (full combo)
endpoint.post({
  authenticator,
  validator: bodyValidator,
  queryValidator,
  handler: async ({ url, query }, auth, body) => {
    const q: string = query.q;
    const name: string = body.name;
    return { typeName: 'Result' as const, q, name, userId: auth.userId };
  }
});

// Tests 1-4 verify inference works by assigning to typed variables.
// If query.q wasn't inferred as string, `const q: string = query.q` would fail.
// If body.name wasn't inferred as string, `const name: string = body.name` would fail.
