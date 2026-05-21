FROM node:20-alpine AS base
RUN npm install -g pnpm@latest
WORKDIR /app

# Copy dependency manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/regression-testing/package.json ./packages/regression-testing/package.json
COPY packages/core/package.json ./packages/core/package.json
COPY packages/express/package.json ./packages/express/package.json
COPY packages/kysely/package.json ./packages/kysely/package.json
COPY packages/zod/package.json ./packages/zod/package.json

# Install dependencies (frozen lockfile ensures reproducibility)
RUN pnpm install --frozen-lockfile

# Build runtime dependencies
COPY packages/core/ ./packages/core/
COPY packages/express/ ./packages/express/
COPY packages/kysely/ ./packages/kysely/
COPY packages/zod/ ./packages/zod/
RUN pnpm --filter @fossyl/core build && \
    pnpm --filter @fossyl/express build && \
    pnpm --filter @fossyl/kysely build && \
    pnpm --filter @fossyl/zod build

# Copy regression-testing source (no build needed — tsx handles it)
COPY packages/regression-testing/ ./packages/regression-testing/

EXPOSE 9877
CMD ["pnpm", "--filter", "@fossyl/regression-testing", "exec", "tsx", "src/server.ts"]
