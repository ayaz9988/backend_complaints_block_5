# ── Stage 1: base ──────────────────────────────────────────────────────────────
#   Sets up the shared runtime for all downstream stages:
#   - Enables pnpm via corepack (the project's package manager)
#   - Sets the working directory to /usr/src/app
FROM node:24-slim AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /usr/src/app


# ── Stage 2: dependencies ─────────────────────────────────────────────────────
#   Installs ALL dependencies (runtime + dev).
#   Only manifest files are copied first so Docker layers are cached —
#   pnpm install only re-runs when package.json, lockfile, or Prisma schema changes.
FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.ts ./
COPY prisma/schema.prisma ./prisma/

RUN pnpm install --frozen-lockfile


# ── Stage 3: build ─────────────────────────────────────────────────────────────
#   Compiles TypeScript to JS, then prunes dev dependencies.
#   Inherits node_modules from the dependencies stage (avoids re-fetching).
FROM dependencies AS build

COPY . .

RUN npx prisma generate

RUN pnpm run build

# Remove devDependencies so only production packages move to the final image.
RUN pnpm prune --prod


# ── Stage 4: run (production) ─────────────────────────────────────────────────
#   Minimal runtime image. Starts fresh from node:24-slim to discard all
#   build-time layers. Only the bare essentials are copied in:
#     - compiled JS (dist/)
#     - production node_modules (already pruned)
#     - package.json (metadata, used by Prisma etc.)
#     - prisma/ schema (needed at runtime for migrations & client generation)
FROM node:24-slim AS run

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /usr/src/app

# Create the app directory as root, then hand ownership to the node user.
# This ensures the app never runs as root inside the container.
RUN mkdir -p /usr/src/app && chown -R node:node /usr/src/app

USER node

COPY --chown=node --from=build /usr/src/app/dist ./dist
COPY --chown=node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node --from=build /usr/src/app/package.json ./
COPY --chown=node --from=build /usr/src/app/prisma ./prisma

EXPOSE 5000

# Docker checks this periodically. Three consecutive failures marks the container
# as unhealthy, which lets orchestration (or compose) restart it automatically.
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD ["node", "-e", "require('http').get('http://localhost:5000', r => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))"]

CMD ["node", "dist/index.js"]
