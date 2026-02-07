# @fossyl/express

**Express.js runtime adapter for fossyl**

## Installation

```bash
npm install @fossyl/express @fossyl/core express
```

## Quick Start

```typescript
import { createRouter } from '@fossyl/core';
import { expressAdapter } from '@fossyl/express';

const router = createRouter('/api');
const routes = [
  router.createEndpoint('/health').get({
    handler: async () => ({ typeName: 'Health' as const, status: 'ok' }),
  }),
];

const adapter = expressAdapter({ cors: true });
adapter.register(routes);
await adapter.listen(3000);
```

## Adapter Options

```typescript
const adapter = expressAdapter({
  // Existing Express app (optional - creates one if not provided)
  app?: Application;

  // Enable CORS (default: false)
  cors?: boolean | CorsOptions;

  // Database adapter for transaction support
  database?: DatabaseAdapter;

  // Logger adapter for request logging
  logger?: LoggerAdapter;

  // Metrics recorder for request tracking
  metrics?: MetricsRecorder;
});
```

## CORS Options

```typescript
type CorsOptions = {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
};
```

## Logger Integration

```typescript
import type { LoggerAdapter } from '@fossyl/core';

const pinoLogger: LoggerAdapter = {
  type: 'logger',
  name: 'pino',
  createLogger: (requestId) => ({
    info: (msg, meta) => pino.info({ requestId, ...meta }, msg),
    warn: (msg, meta) => pino.warn({ requestId, ...meta }, msg),
    error: (msg, meta) => pino.error({ requestId, ...meta }, msg),
  }),
};

const adapter = expressAdapter({ logger: pinoLogger });
```

## Metrics Integration

```typescript
const adapter = expressAdapter({
  metrics: {
    onRequestStart: ({ method, path, requestId }) => { },
    onRequestEnd: ({ method, path, requestId, statusCode, durationMs }) => { },
    onRequestError: ({ method, path, requestId, error, durationMs }) => { },
  },
});
```

## Accessing Request Context

Use these functions anywhere in your handler call stack:

```typescript
import { getContext, getLogger, getRequestId, getDb } from '@fossyl/express';

const logger = getLogger();
const requestId = getRequestId();
const dbContext = getDb(); // If database adapter configured
```

## Error Handling

```typescript
import { AuthenticationError, ValidationError } from '@fossyl/express';

// Returns 401
throw new AuthenticationError('Invalid token');

// Returns 400
throw new ValidationError('Invalid input', { field: 'email' });
```

## Response Format

All responses are wrapped automatically:

```typescript
// Handler returns:
{ typeName: 'User', id: '123', name: 'John' }

// Client receives:
{
  success: "true",
  type: "User",
  data: { typeName: 'User', id: '123', name: 'John' }
}
```

## Integration with Database Adapters

```typescript
import { expressAdapter } from '@fossyl/express';
import { kyselyAdapter } from '@fossyl/kysely';

const adapter = expressAdapter({
  database: kyselyAdapter({ client: db }),
});
```

The framework adapter will:
- Call `database.onStartup()` when `listen()` is called
- Wrap handlers with `withTransaction()` for POST/PUT routes
- Wrap handlers with `withClient()` for GET/DELETE routes

## Exports

```typescript
// Main adapter
export { expressAdapter } from '@fossyl/express';

// Context accessors
export { getContext, getLogger, getRequestId, getDb } from '@fossyl/express';

// Errors
export { AuthenticationError, ValidationError, ERROR_CODES } from '@fossyl/express';

// Types
export type {
  ExpressAdapterOptions,
  CorsOptions,
  MetricsRecorder,
  RequestContext,
} from '@fossyl/express';
```
