# Argus — Infrastructure

Docker Compose for local dependencies and a full production-like stack.

---

## Quick start (recommended for development)

Spin up Postgres + Redis, then run the app on the host with `pnpm dev`:

```bash
# 1. Start dependencies
docker compose -f infra/docker-compose.yml up -d

# 2. Copy connection strings into your .env files
#    (see infra/.env.docker for values)
#    app/backend/api/.env
#    app/backend/worker/.env

# 3. Migrate + run
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Connection strings (from `infra/.env.docker`):

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://argus:argus@localhost:5432/argus` |
| `REDIS_URL` | `redis://localhost:6379` |

Stop dependencies:

```bash
docker compose -f infra/docker-compose.yml down
```

---

## Full stack (Docker)

Runs Postgres, Redis, API, worker, and frontend (nginx) in containers.

```bash
cp infra/.env.example infra/.env   # set SESSION_SECRET at minimum
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env up -d --build
```

| Service | URL |
|---------|-----|
| Dashboard | http://localhost:8080 |
| API | http://localhost:3000 |

Migrations run automatically via a one-shot `migrate` service before the API starts.

Tear down (keeps volumes):

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env down
```

Reset all data:

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env down -v
```

---

## Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Postgres 16 + Redis 7 for local dev |
| `docker-compose.prod.yml` | Full stack with migrate, api, worker, frontend |
| `.env.example` | Env vars for `docker-compose.prod.yml` |
| `.env.docker` | Connection strings for host-based `pnpm dev` |
| `../app/backend/api/Dockerfile` | API image (multi-stage, pnpm monorepo) |
| `../app/backend/worker/Dockerfile` | Worker image |
| `../app/frontend/Dockerfile` | Vite build → nginx |
| `../.dockerignore` | Build context exclusions |

---

## Root scripts

```bash
pnpm docker:deps   # start Postgres + Redis
pnpm docker:prod   # build + start full stack
```

---

## Production notes

- Set a strong `SESSION_SECRET` in `infra/.env`.
- Point `FRONTEND_URL`, `DSN_HOST`, and OAuth callback URLs at your public domain.
- Rebuild frontend with the correct `VITE_API_URL` build arg (browser must reach the API).
- For TLS, put Caddy or nginx in front of the `frontend` and `api` services.
- TimescaleDB hypertables are planned but not wired yet — Postgres 16 is used for now.

---

## Planned

- [ ] TimescaleDB image + hypertable migrations for events & transactions
- [ ] Caddy reverse-proxy config with automatic HTTPS
- [ ] Healthcheck scripts for external monitoring
