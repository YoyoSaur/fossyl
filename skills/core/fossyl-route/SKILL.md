---
name: fossyl-route
description: Use when defining route handlers in a fossyl project — builder chain, handler curry signatures, authWrapper, bodyWrapper, pagination config
license: GPL-3.0
compatibility: opencode
metadata:
  audience: fossyl-user
---

# fossyl-route

## Overview

Fossyl routes use a builder chain: `createEndpoint()` → `.authenticator()` (optional) → `.validator()` (optional) → HTTP method (`.get()`, `.post()`, `.put()`, `.delete()`).

## Builder Chain

```typescript
createEndpoint()
  .authenticator(authenticate)  // optional — adds auth
  .validator(myValidator)       // optional — adds body validation
  .get(handler)                 // one of: get, post, put, delete
```

## Handler Curry Signatures

| # | Method | Auth | Body | Signature |
|---|--------|------|------|-----------|
| 1 | get | no | no | `() => Response<ResBody>` |
| 2 | get | yes | no | `(auth: Auth) => Response<ResBody>` |
| 3 | post | no | yes | `(body: Body) => Response<ResBody>` |
| 4 | post | yes | yes | `(auth: Auth, body: Body) => Response<ResBody>` |
| 5 | put | no | yes | `(body: Body) => Response<ResBody>` |
| 6 | put | yes | yes | `(auth: Auth, body: Body) => Response<ResBody>` |
| 7 | delete | no | no | `() => Response<ResBody>` |
| 8 | delete | yes | no | `(auth: Auth) => Response<ResBody>` |

## authWrapper

```typescript
const authenticate = authWrapper((req) => {
  const userId = req.headers["x-user-id"];
  if (!userId) return { error: fossylUnauthorized("Missing user") };
  return { auth: { userId } };
});
```

## bodyWrapper

```typescript
const myValidator = bodyWrapper(myZodSchema);
```

## Pagination Config

Use `fossyl-pagination` for paginated list endpoints. Add `page` and `pageSize` query params to the route definition.

## Route Registration

Import and call the route function in your server entry (`src/index.ts`):

```typescript
import { myPingRoute } from "./features/my/routes/my.route";
myPingRoute(router);
```
