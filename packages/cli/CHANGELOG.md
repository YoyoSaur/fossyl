# fossyl

## 1.1.5

### Patch Changes

- Kysely examples now use `@libsql/client` + `@libsql/kysely-libsql` for Docker/production and `better-sqlite3` for local dev (dual-mode db.ts)
- Dockerfiles updated to two-stage build with prod-only deps (`pnpm install --prod`)
- docker-compose.yml adds `sqld` service for multi-client SQLite access
- Dockerfile, docker-compose.yml, and .env.example now generated when `--docker` flag is used
- Package.json for kysely examples: `better-sqlite3` moved to devDeps, `@libsql/client` and `@libsql/kysely-libsql` added
- Removed `@types/better-sqlite3` from example devDependencies

## 1.1.4

### Patch Changes

- Scaffolding now generates `.gitignore` and runs `git init` in new projects
- Added `esbuild` to `onlyBuiltDependencies` in kysely example package.jsons

## 1.1.3

### Patch Changes

- Bumped example Dockerfiles from `node:20-alpine` to `node:22-alpine` for pnpm 11 compatibility
- Fixed `created_at` type mismatch (`Date` → `string`) in example services and Kysely types
- Added `.npmrc` with `minimum-release-age=0` to examples for freshly published packages
- Added `onlyBuiltDependencies: ["better-sqlite3"]` to kysely example package.jsons

## 1.1.1

### Patch Changes

- Fixed `files` array — changed `"example"` to `"examples"` so the examples directory is included in the published tarball

## 1.1.0

### Minor Changes

- License changed from GPL-3.0 to Apache-2.0
- CLI scaffolding now injects real version numbers instead of `workspace:*` for fossyl dependencies
- Added `cli` version to `generate-versions.js`
- Added `publish` script to root package.json

## 1.0.0

### Major Changes

- Version 1.0 release, the core offering and all adapters finished for a releaseable state.

## 0.16.0

### Minor Changes

- Fixed some CLI stuff, also just keeping everything on the same version for now

## 0.14.0

### Minor Changes

- Fixed CLI scaffolding I think

## 0.12.0

### Minor Changes

- CLEAN it up

## 0.11.0

### Minor Changes

- CLI fixes

## 0.10.0

### Minor Changes

- Readme!
- ## 0.9.0 - Pre-release milestone

  ### CLI Package Separation
  - Moved CLI from `@fossyl/core` to unscoped `fossyl` package
  - Users can now run `npx fossyl --create my-api` instead of `npx @fossyl/core`
  - Core package now focused solely on router and types
  - CLI can be versioned independently

  ### Documentation
  - Added top-level README.md with getting started guide
  - Updated ROADMAP.md with completed milestones
  - Each package includes comprehensive CLAUDE.md for AI-assisted development

  ### Package Structure

  ```
  packages/
  ├── core/       # @fossyl/core - Router and types
  ├── cli/        # fossyl - Scaffolding CLI
  ├── express/    # @fossyl/express - Express adapter
  ├── zod/        # @fossyl/zod - Zod validation adapter
  ├── kysely/     # @fossyl/kysely - Kysely database adapter
  └── docs/       # Documentation site
  ```

- First big release before 1.0! Adapters ready, CLI ready, just publishing coming
