// @code-block-start: validator-function
// Validators are just pure functions: (data: unknown) => T
// No framework coupling, no special decorators, no base classes

import { createRouter } from '@fossyl/core';

const router = createRouter<"/api">("/api");

// Manual validator — no library needed
const createUserValidator = (data: unknown): { name: string; email: string } => {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Request body must be an object');
  }
  const obj = data as Record<string, unknown>;
  if (typeof obj.name !== 'string' || obj.name.length === 0) {
    throw new Error('name is required and must be a string');
  }
  if (typeof obj.email !== 'string' || !obj.email.includes('@')) {
    throw new Error('email must be a valid email address');
  }
  return { name: obj.name, email: obj.email };
};

// Use the chain pattern — the return type becomes the body type
const createUserRoute = router.createEndpoint('/api/users').validator(
  createUserValidator,
).post(
  (body) => async () => {
    // body is typed as { name: string; email: string }
    return { typeName: 'User' as const, ...body, id: crypto.randomUUID() };
  },
);
// @code-block-end: validator-function
