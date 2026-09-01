---
name: fossyl-debug
description: Use when debugging type inference failures or runtime route errors in a fossyl project — curry signature mismatches, branded wrappers, pagination shapes, missing typeName
license: GPL-3.0
compatibility: fossyl
metadata:
  audience: fossyl-user
---

# fossyl-debug

## Overview

Systematic method for debugging the hardest part of fossyl: its type-inference
and builder-chain failures. Most "it doesn't compile" and "the type is wrong"
problems trace back to a small set of root causes. Start with the triage table,
then reconstruct the expected handler signature step by step.

## Triage: Common Error → Root Cause

| Symptom                                            | Root Cause                                                                                      | Fix                                                                                                   |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| "Expected N arguments, but got M" in handler       | Curried layers (`params`/`auth`/`body`) don't match the chain steps                             | Reconstruct expected signature from the chain (below); add/remove curry layers                        |
| `Auth` / `Body` type is wrong or unassignable      | Wrong branded wrapper — `authWrapper` vs a plain value; `bodyWrapper` missed                    | Wrap auth in `authWrapper((req) => ({ auth }))`; wrap validation in `bodyWrapper(schema)`             |
| `Property 'auth' does not exist on ...`            | `.authenticator()` not added, or accessing `params.auth` without the auth layer                 | Add `.authenticator(f)` to the chain                                                                  |
| `Property 'body' does not exist on ...`            | access `body` from `params` instead of using the separate curry layer                           | When `.validator()` is used, body is its own layer: `(params) => (auth) => (body) => async () => ...` |
| Return type not matching expected `Response<...>`  | missing `typeName` in the returned object                                                       | Return `{ typeName: "Name", ...data }`                                                                |
| `.paginate()` not producing `PaginatedResponse<T>` | handler returns a bare array/object instead of the paginated shape, or `.paginate()` is missing | Return `{ items, total, page, pageSize, hasMore }`; confirm `.paginate()` is in the chain             |
| Query params not typed / `query` missing           | `.query(qv)` not in the chain; query validator not applied                                      | Add `.query(queryValidator)`                                                                          |
| `handler` callback not returning a function        | Confusing the curried handler with a plain async handler                                        | Innermost layer is `async () => ...`; outer layers return the next function synchronously             |

## Step-by-Step Reconstruction

When the signature doesn't line up, derive what the type system expects:

1. **List the chain steps** in order:
   `createEndpoint(path)` → [`.query(qv)`] → [`.paginate(c)`] → [`.authenticator(f)`] → [`.validator(v)`] → terminal.
2. **Map steps to handler layers:**
   - `params` object is always the outer layer when any of
     `.query` / `.paginate` / path params exist. It carries `url`, `query`, and
     `pagination`.
   - `auth` becomes its own middle layer when `.authenticator()` is present.
   - `body` becomes its own layer when `.validator()` is present.
   - Accumulated layers are synchronously-returned functions; only the innermost
     `() => Promise<Response>` is `async`.
3. **Write the expected signature:**
   ```
   (params?) => (auth?) => (body?) => async () => Promise<Response>
   ```
4. **Compare to the actual handler.** If the actual handler takes fewer/more
   layers, adjust. Use `_params` / `_auth` when a layer exists but isn't used.
5. **Fix the smallest change** — add/remove a curry layer, add the missing chain
   step, or wrap/unwrap with the correct branded helper.

## Branded Wrappers

Fossyl's auth and validation use **branded types** (`authWrapper`, `bodyWrapper`);
getting a value "right" at runtime but untyped is a common trap.

- `authWrapper((req) => ...)` must return `{ error }` or `{ auth }`. Returning a
  bare object breaks the branded auth type.
- `bodyWrapper(schema)` (or a validator function returning `T | Promise<T>`)
  types `body`. A raw schema without wrapping won't match the expected `body`.

Verify at the call site: the value must flow through the wrapper, not be
re-constructed inline.

## Pitfalls

- **Partial application** — the outer layers are functions, not values. Calling
  the handler's outer function without returning the inner `async` function gives
  a runtime "not a function" error.
- **`_params` naming** — when `params` exists but is unused, prefix with `_` to
  avoid the unused-variable error while keeping the layer.
- **Shared middleware illusion** — each endpoint chain is self-contained; if
  behavior "should" be shared, it belongs in a service, authenticator, or
  validator — not hidden middleware.
- **N+1 pagination** — `.paginate()` expects `{ items, total, page, pageSize,
hasMore }` from the handler; returning raw query rows is a shape mismatch
  (see `fossyl-pagination`).

## Verification

After a fix, confirm by:

1. Re-reading the chain steps and the handler signature together.
2. Running the project's `typecheck` to confirm the error is gone.
3. If the fix involved a wrapper or a chain step, tracing the data once through
   the runtime adapter (start the server and hit the route) to confirm behavior.
