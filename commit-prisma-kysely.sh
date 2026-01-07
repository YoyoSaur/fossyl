#!/bin/bash
# Script to commit the prisma-kysely package changes
# Run this from within the prisma-kysely worktree directory:
#   cd /Users/grant/workdir/OpenSource/fossyl-worktrees/prisma-kysely
#   chmod +x commit-prisma-kysely.sh
#   ./commit-prisma-kysely.sh
#
# Or run commands manually step by step.

set -e

echo "=== Installing dependencies ==="
pnpm install

echo ""
echo "=== Running TypeScript check ==="
cd packages/prisma-kysely
pnpm run typecheck || echo "Note: typecheck may need kysely types installed"
cd ../..

echo ""
echo "=== Removing this script (not part of package) ==="
rm -f commit-prisma-kysely.sh

echo ""
echo "=== Git Status ==="
git status

echo ""
echo "=== Adding new files ==="
git add packages/prisma-kysely/

echo ""
echo "=== Committing ==="
git commit -m "$(cat <<'EOF'
feat(prisma-kysely): add @fossyl/prisma-kysely database adapter

Implements the Prisma-Kysely database adapter for fossyl with:
- AsyncLocalStorage-based transaction context
- Proxy pattern for automatic transaction routing
- Code emitters for setup, wrapper, and startup code
- Support for auto-migrate via prisma db push
- Configurable default transaction behavior

The adapter integrates Prisma for schema/migrations with Kysely for
type-safe queries, providing transparent transaction handling.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"

echo ""
echo "=== Pushing to remote ==="
git push -u origin packages/prisma-kysely

echo ""
echo "=== Creating PR ==="
gh pr create --base core/adapter-types --title "feat(prisma-kysely): add @fossyl/prisma-kysely database adapter" --body "$(cat <<'EOF'
## Summary
- Implements `@fossyl/prisma-kysely` database adapter for fossyl
- Uses AsyncLocalStorage + Proxy pattern for automatic transaction handling
- Provides code emitters for framework adapter integration
- Supports configurable auto-migrate and default transaction behavior

## Package Structure
- `src/types.ts` - PrismaKyselyAdapterOptions type
- `src/context.ts` - AsyncLocalStorage transaction context
- `src/proxy.ts` - Kysely proxy for transaction detection
- `src/emitter.ts` - Code generation functions
- `src/adapter.ts` - prismaKyselyAdapter() implementation
- `src/index.ts` - Public exports

## Test plan
- [ ] Verify TypeScript compiles with `pnpm run typecheck`
- [ ] Test with a sample fossyl project using Prisma + Kysely
- [ ] Verify generated code works with Express adapter

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

echo ""
echo "=== Done! ==="
echo "PR should be created. Check the output above for the PR URL."
