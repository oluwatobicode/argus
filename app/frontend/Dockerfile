# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/sdk-core/package.json ./packages/sdk-core/
COPY packages/sdk-browser/package.json ./packages/sdk-browser/
COPY packages/sdk-react/package.json ./packages/sdk-react/
COPY app/frontend/package.json ./app/frontend/
RUN pnpm install --frozen-lockfile --filter frontend...

FROM deps AS build
COPY packages/sdk-core ./packages/sdk-core
COPY packages/sdk-browser ./packages/sdk-browser
COPY packages/sdk-react ./packages/sdk-react
COPY app/frontend ./app/frontend

ARG VITE_API_URL=http://localhost:3000/api/v1
ARG VITE_ARGUS_DSN=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ARGUS_DSN=$VITE_ARGUS_DSN

RUN pnpm --filter @argusdev/sdk-core build
RUN pnpm --filter @argusdev/sdk-browser build
RUN pnpm --filter @argusdev/sdk-react build
RUN pnpm --filter frontend build

FROM nginx:1.27-alpine AS runner
COPY app/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/app/frontend/dist /usr/share/nginx/html
EXPOSE 80
