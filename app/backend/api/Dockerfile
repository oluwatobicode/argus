# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY app/backend/api/package.json ./app/backend/api/
RUN pnpm install --frozen-lockfile --filter @argus/api...

FROM deps AS build
COPY app/backend/api ./app/backend/api
WORKDIR /app/app/backend/api
ENV DATABASE_URL="postgresql://argus:argus@postgres:5432/argus"
RUN pnpm exec prisma generate
RUN pnpm build

FROM base AS runner
WORKDIR /app/app/backend/api
ENV NODE_ENV=production

RUN addgroup -S argus && adduser -S argus -G argus

COPY --from=build /app/app/backend/api/dist ./dist
COPY --from=build /app/app/backend/api/src/generated ./dist/generated
COPY --from=build /app/app/backend/api/prisma ./prisma
COPY --from=build /app/app/backend/api/package.json ./package.json
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/app/backend/api/node_modules ./node_modules

USER argus
EXPOSE 3000
CMD ["node", "dist/server.js"]
