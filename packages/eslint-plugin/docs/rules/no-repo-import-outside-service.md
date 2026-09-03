# no-repo-import-outside-service

Enforces the service layer boundary between repositories (data access) and services (business logic). Prevents importing `.repo` files anywhere except `.service` files, and prevents `.repo` files from importing `.service` files — blocking the `service <-> repo` cycle.

Enforces the layered architecture: `routes -> services -> repos -> db`.

## Rule Details

This rule reports two violations:

1. **`repoImportOutsideService`** — a `.repo` file is imported outside a `.service` file. Repository files can only be imported in service files.
2. **`serviceImportInRepo`** — a `.repo` file imports a `.service` file. Repos must not depend on services, otherwise a `service -> repo -> service` cycle is created.

## Examples

### Incorrect

```ts
// user.route.ts — route importing a repo directly
import { repo } from "./repo/user.repo";
```

```ts
// discord.repo.ts — repo importing a service (creates a cycle)
import { cacheChannelName } from "./analytics.service";
```

### Correct

```ts
// user.service.ts — service importing a repo
import { repo } from "./repo/user.repo";
```

```ts
// user.route.ts — route importing a service
import { svc } from "./services/user.service";
```

## Options

- `allowImports` (string[]): Additional import paths that are allowed to import `.repo` files (applies to both directions).
