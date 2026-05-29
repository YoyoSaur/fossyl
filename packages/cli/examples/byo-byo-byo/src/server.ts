import type { Route } from '@fossyl/core';

/**
 * TODO: Implement your server adapter
 *
 * This function should:
 * 1. Create an HTTP server (Express, Fastify, Hono, etc.)
 * 2. Register each route from the routes array
 * 3. Handle request/response transformation
 * 4. Implement error handling
 *
 * See packages/express/ for a reference implementation.
 */
export function startServer(routes: Route[], port: number): void {
  console.log('TODO: Implement server adapter');
  console.log(`Routes to register: ${routes.length}`);
  console.log(`Port: ${port}`);
  throw new Error('Server adapter not implemented. See src/server.ts for instructions.');
}
