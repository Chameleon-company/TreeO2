# Setup Guide

Local development setup for the TreeO2 backend API.

---

## Prerequisites

Make sure you have the following installed before starting:

| Tool | Version | Notes |
|---|---|---|
| Node.js | ≥ 20.x | Use [nvm](https://github.com/nvm-sh/nvm) to manage versions |
| npm | ≥ 10.x | Comes with Node.js |
| Docker | Latest | Required to run PostgreSQL and backend locally with Docker Compose |
| Git | Latest | |

To check your versions:
```bash
node -v
npm -v
docker -v
```

---

## First-Time Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd treeo2-backend
```

### 2. Install dependencies

```bash
npm install
```

> This also runs `husky` automatically to set up pre-commit hooks.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Then open `.env` and set at minimum:

```env
JWT_SECRET=your-secret-key-at-least-32-characters-long
DATABASE_URL=postgresql://your-db-user:your-db-password@localhost:5432/your-db-name?schema=public
```

If the backend runs locally, `DATABASE_URL` should use `localhost`.
If the backend runs inside Docker Compose, `DATABASE_URL` should use `postgres` as the host instead.

All other defaults work for local development. See [Environment Variables](#environment-variables) below for the full reference.

### 4. Start local database (recommended for development)

```bash
docker compose up -d postgres
```

This starts PostgreSQL from `docker-compose.yml` without starting the backend container.
This is the recommended path for normal development because the backend can then run locally with `npm run dev` and use migration-based Prisma workflow.

To confirm it's healthy:
```bash
docker compose ps
# postgres should show healthy
```

### 5. Generate Prisma client and apply schema changes

```bash
npm run prisma:generate
# If migration files already exist, use:
npm run prisma:migrate:dev
# If migration files do not exist yet and you only need to sync the local DB, use:
npm run prisma:push
```

This project uses Prisma's multi-file schema layout:

- `prisma.config.ts` points Prisma at the `./prisma` directory
- `prisma/schema.prisma` contains `generator`, `datasource`, and shared enums
- `prisma/models/*.prisma` contains the model definitions

### 6. Seed the database (optional)

```bash
ALLOW_SAMPLE_SEED=true npm run prisma:seed
```

> Seeds are for local/dev only — never run against production.
> The sample seed expects a clean local database and is intentionally blocked unless `ALLOW_SAMPLE_SEED=true` is set.
> Optional password overrides are available through `SEED_ADMIN_PASSWORD`, `SEED_MANAGER_PASSWORD`, `SEED_INSPECTOR1_PASSWORD`, `SEED_INSPECTOR2_PASSWORD`, `SEED_FARMER1_PASSWORD`, `SEED_FARMER2_PASSWORD`, and `SEED_DEVELOPER_PASSWORD`.

### 7. Start the dev server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

Health check: `GET http://localhost:3000/health`
Swagger docs: http://localhost:3000/api-docs

```json
{ "success": true, "status": "ok", "timestamp": "..." }
```

---

## Environment Variables

All variables are validated on startup via Zod. The server will exit immediately with a clear error if any required variable is missing or invalid.

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | `development` or `production` |
| `PORT` | No | `3000` | Port the server listens on |
| `DB_HOST` | No | `localhost` | PostgreSQL host |
| `DB_PORT` | No | `5432` | PostgreSQL port |
| `DB_NAME` | No | `treeo2` | Database name |
| `DB_USER` | No | `treeo2_user` | Database user |
| `DB_PASSWORD` | No | `treeo2_password` | Database password |
| `DATABASE_URL` | **Yes** | postgresql://your-db-user:your-db-password@localhost:5432/your-db-name?schema=public | Prisma/PostgreSQL connection string |
| `JWT_SECRET` | **Yes** | Zx9@vP4#Lm2$Qw8!Rt6^Hy1&Uk3*Ns5%Bd7@Fx0!Lp | Min 32 characters. Use a strong random string in production |
| `JWT_EXPIRES_IN` | No | `24h` | Token expiry — e.g. `1h`, `7d`, `24h` |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit window in ms (default: 15 min) |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per window per IP |

To generate a strong `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Daily Development

### Start everything

```bash
# Terminal 1 — database (if not already running)
docker compose up -d postgres

# Terminal 2 — Prisma client/schema sync
npm run prisma:generate
# If migration files already exist, use:
npm run prisma:migrate:dev
# If migration files do not exist yet and you only need to sync the local DB, use:
npm run prisma:push

# Terminal 3 — API server with hot reload
npm run dev
```

This is the preferred team workflow when schema changes are captured as migrations under `prisma/migrations/`. If there are no migration files yet, `npm run prisma:push` is the fallback to sync the local database.

### Run everything in Docker Compose

If you want both the backend and database to run in Docker:

1. Set `DATABASE_URL` in `.env` to use `postgres` as the host
2. Start Compose:

```bash
docker compose up --build
```

The backend container currently runs:

```bash
npx prisma generate --schema ./prisma
npx prisma db push --schema ./prisma
npm run dev
```

That is compatible with the multi-file Prisma schema, but it uses `db push` instead of migrations.

### Stop everything

```bash
# Stop the dev server
Ctrl+C

# Stop the database
docker compose down
```

### Reset the database

```bash
docker compose down -v       # removes the postgres_data volume
docker compose up -d postgres
# If migration files already exist, use:
npm run prisma:migrate:dev
# If migration files do not exist yet and you only need to sync the local DB, use:
npm run prisma:push
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled output (production) |
| `npm run lint` | Run ESLint (zero warnings allowed) |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format` | Auto-format all source files with Prettier |
| `npm run format:check` | Check formatting without writing |
| `npm run type-check` | TypeScript type check without emitting |
| `npm run validate` | Run type-check + lint + format check (run before PRs) |
| `npm run prisma:generate` | Generate Prisma client from the `prisma/` directory schema |
| `npm run prisma:push` | Push schema directly to the database without creating migrations |
| `npm run prisma:migrate:dev` | Create and apply a development migration |
| `npm run prisma:migrate:deploy` | Apply migrations |
| `npm run prisma:seed` | Seed local sample data after setting `ALLOW_SAMPLE_SEED=true` |
| `npm test` | Run Jest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

---

## Docker Reference

The `docker-compose.yml` defines two services:

| Service | Container | Port | Credentials |
|---|---|---|---|
| PostgreSQL 16 | `treeo2_postgres` | `5432` | `treeo2_user` / `treeo2_password` |
| Backend API | `treeo2_backend` | `3000` | Uses `.env` |

Useful Docker commands:

```bash
# View logs
docker logs treeo2_postgres

# Connect to the database directly
docker exec -it treeo2_postgres psql -U treeo2_user -d treeo2

# Check container health
docker inspect treeo2_postgres --format='{{.State.Health.Status}}'
```

---

## Troubleshooting

**Port 5432 already in use**
```bash
# Find what's using it
lsof -i :5432
# Stop local PostgreSQL if running
brew services stop postgresql   # macOS
sudo service postgresql stop    # Linux
```

**`JWT_SECRET must be at least 32 characters` on startup**
Your `.env` file is missing or has a short `JWT_SECRET`. See the [generate command](#environment-variables) above.

**Prisma client not generated**
```bash
npm run prisma:generate
```

**Database schema changes not applied**
```bash
# If migration files already exist, use:
npm run prisma:migrate:dev
# If migration files do not exist yet and you only need to sync the local DB, use:
npm run prisma:push
```

**`Cannot find module` errors after pulling changes**
```bash
npm install   # dependencies may have changed
```

**Pre-commit hook failing**
```bash
npm run lint:fix    # fix auto-fixable issues
npm run format      # fix formatting
npm run validate    # confirm everything passes
```

**Database connection refused**
```bash
docker compose up -d postgres   # make sure the container is running
docker compose ps               # confirm it shows "healthy"
```
