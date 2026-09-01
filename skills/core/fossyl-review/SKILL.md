---
name: fossyl-review
description: Use when reviewing a fossyl project's code against framework standards — route builder chains, type safety, layering rules, error handling, query hygiene, path conventions
license: GPL-3.0
compatibility: fossyl
metadata:
  audience: fossyl-user
---

# fossyl-review

## Overview

Review a fossyl codebase (or a feature, diff, or pull request) against the
framework's conventions. Produce a prioritized list of findings — each tagged as
an **error**, **warning**, or **suggestion** — with the file:line, the rule
violated, and the matching `eslint-plugin-fossyl` rule name where one exists.

Run this skill when completing implementation, before merging, or when another
agent requests a review of fossyl code.

## Review Passes

Work through each pass. Do not stop after the first pass — all passes are
required.

### Pass 1: Route & Builder Chain

Routes are defined with `createRouter(path)` + per-endpoint `createEndpoint(path)`
builder chains. Verify:

- **Terminal method present** — every chain ends in `.get()`, `.post()`, `.put()`,
  or `.delete()`; nothing is left as a bare `createEndpoint`.
- **Chain order** — steps appear in enforced order:
  `.query(qv)` → `.paginate(c)` → `.authenticator(f)` → `.validator(v)` → terminal.
- **No shared global middleware** — each `export const` shows the full chain;
  handlers do not rely on hidden route-level middleware.
- **Per-endpoint `createRouter`** — `createRouter` is only a path-prefix
  convenience; every endpoint is self-contained via `createEndpoint`.
- **Newline formatting** — builder chain steps are on separate lines.
  (`eslint-plugin-fossyl`: `builder-chains-newline`, `no-router-chain`)

### Pass 2: Handler Signature & Type Safety

The handler curries layers: `(params?) => (auth?) => (body?) => async () => ...`.
Verify the actual handler arity matches the chain layers:

| Chain Layers         | Expected Handler                                              |
| -------------------- | ------------------------------------------------------------- |
| none                 | `async () => ({ ... })`                                       |
| params only          | `(params) => async () => ({ ... })`                           |
| auth only            | `(params) => async () => ({ ... })` — `params.auth` available |
| params + auth        | `(params) => async () => ({ ... })` — `params.auth` available |
| body only            | `(body) => async () => ({ ... })`                             |
| params + body        | `(params) => async () => ({ ... })` — `params.body` available |
| auth + body          | `(_params) => (auth) => (body) => async () => ({ ... })`      |
| params + auth + body | `(params) => (auth) => (body) => async () => ({ ... })`       |

Also verify:

- **No `any`** — no untyped `any` in handler params, body, or returns.
- **`typeName` present** — every returned response object includes
  `typeName: "Name"` for discriminated-union matching.
- **Explicit returns** — handler functions return their response object; no
  implicit `undefined` returns.
- **Correct wrapper usage** — `authWrapper` returns `{ auth }` or `{ error }`,
  never a bare value; body validation flows through `bodyWrapper` or a validator
  function.
  (`eslint-plugin-fossyl`: `consistent-naming` for naming consistency)

### Pass 3: Architecture Layering

Enforce the import boundary rules:

- **Routes call services, never repos or `db` directly.**
- **Services import repos and other services; never import `db` directly.**
- **Repos import `db` (or an external SDK client); a single repo is imported by
  at most one service.** Repos are thin (15–30 lines) data adapters.
- **External models** — repos transform SDK/third-party models into domain models
  at the repo boundary; SDK types never leak into services/routes.
  (`eslint-plugin-fossyl`: `no-repo-import-outside-service`,
  `no-db-import-outside-repo`)

### Pass 4: Error Handling

- **No bare throws** — `throw fossylNotFound(...)`, never `throw new Error(...)`.
- **Branded creators** — use `fossylNotFound` (404), `fossylConflict` (409),
  `fossylUnauthorized` (401), `fossylBadRequest` (400), `fossylInternal` (500).
- **Services wrap third-party errors** — DB/network/SDK errors are caught and
  re-thrown as branded `fossylInternal`; use `isFossylError(e)` to rethrow branded.
- **Repos never throw** — return `undefined` for not-found; the service decides.
- **Route handlers do not catch** — the adapter formats branded errors into HTTP
  responses automatically.
  (`eslint-plugin-fossyl`: `no-bare-throw`)

### Pass 5: Query Hygiene

- **No raw SQL** — Kysely queries use the query builder; no interpolated SQL
  strings.
  (`eslint-plugin-fossyl`: `no-raw-sql`)

### Pass 6: Path & Naming Conventions

- **Path prefix convention** — `createRouter` / `createEndpoint` paths follow the
  project's configured prefix convention (e.g. `/api`, feature-scoped prefixes).
- **No mixed prefixes** — endpoints in the same feature use consistent prefixes.
- **No duplicate routes** — same method + path registered only once, within a file
  and across files.
- **Route uniqueness** — path params use `:name` syntax consistently.
- **All routes registered** — route exports are imported and called in the server
  entry point.
- **Naming** — route/service/repo/validator files follow the feature-scoped naming
  convention consistent with the codebase.
  (`eslint-plugin-fossyl`: `path-prefix-convention`, `no-mixed-prefixes`,
  `no-duplicate-routes`, `no-unregistered-route`)

## Finding Format

Report each finding as:

```
[severity] RuleName — file:line — description

Path to fix (one sentence)
```

Example:

```
[error] no-bare-throw — src/features/todos/todos.service.ts:42 — throws new Error; use fossylNotFound / fossylInternal
[warning] no-db-import-outside-repo — src/features/todos/todos.service.ts:3 — service imports db directly; route db access through the repo
```

**Severity guide:**

- **error** — violates a hard correctness/type rule (broken chain, `any`, bare
  throw, wrong layering, duplicate route).
- **warning** — deviates from an enforced convention (prefix style, naming,
  formatting).
- **suggestion** — optional improvement (thin handler, clearer naming, better
  composition).

## Output

End with a short summary: total findings by severity, and a one-line verdict
("ready to merge" / "needs fixes before merge"). If no findings, state that the
code passes all six passes.
