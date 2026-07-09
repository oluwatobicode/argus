# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY app/backend/worker/package.json ./app/backend/worker/
RUN pnpm install --frozen-lockfile --filter @argus/worker...

FROM deps AS build
COPY app/backend/worker ./app/backend/worker
WORKDIR /app/app/backend/worker
ENV DATABASE_URL="postgresql://argus:argus@postgres:5432/argus"
RUN pnpm exec prisma generate --schema=prisma/schema.prisma
RUN pnpm build

FROM base AS runner
WORKDIR /app/app/backend/worker
ENV NODE_ENV=production

RUN addgroup -S argus && adduser -S argus -G argus

COPY --from=build /app/app/backend/worker/dist ./dist
COPY --from=build /app/app/backend/worker/src/generated ./dist/generated
COPY --from=build /app/app/backend/worker/package.json ./package.json
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/app/backend/worker/node_modules ./node_modules

USER argus
CMD ["node", "dist/index.js"]
