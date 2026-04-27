# TreeO2 Backend API

RESTful API for the TreeO2 tree tracking platform — built for xpand Foundation.

## Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **ORM / Data Access**: Prisma
- **Database**: PostgreSQL (Docker for local dev)
- **Containerisation**: Docker + Docker Compose (local development)
- **Auth**: JWT (Bearer token)
- **Validation**: Zod
- **Logging**: Winston
- **API Documentation**: Swagger / OpenAPI
- **Cloud**: AWS Elastic Beanstalk + SQS + S3

---

## Quick Start (Docker)

```bash
# 1. Set up environment
cp .env.example .env

# 2. If the backend will run in Docker, set DATABASE_URL to use the postgres service host
# DATABASE_URL=postgresql://<user>:<password>@postgres:5432/<db>?schema=public
# If the backend will run locally, keep DATABASE_URL using localhost
# DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<db>?schema=public

# 3. Run backend + database
docker compose up --build
```

This starts PostgreSQL and the backend in containers. In this flow, the backend connects to the database using the Docker service name `postgres`, not `localhost`.

---

## Quick Start (Manual Setup — Recommended For Development)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET (min 32 chars)
# If the backend runs locally, DATABASE_URL should use localhost

# 3. Start Postgres
docker compose up -d postgres

# 4. Generate Prisma client
npm run prisma:generate

# 5. Apply schema changes
# Choose one:
# If migration files already exist, use:
npm run prisma:migrate:dev
# If migration files do not exist yet and you only need to sync the local DB, use:
npm run prisma:push

# 6. Seed local data
ALLOW_SAMPLE_SEED=true npm run prisma:seed

# 7. Start dev server
npm run dev
```

The sample seed is for local development only. It expects a clean local database and is intentionally blocked unless `ALLOW_SAMPLE_SEED=true` is provided. It will only run when `NODE_ENV` is `development` or `test`.

API is available at `http://localhost:3000`  
Health check: `GET /health`
Swagger docs: `http://localhost:3000/api-docs`

## Project Structure

```
src/
├── config/          # env, database pool, logger, swagger config
├── middleware/      # Express middleware (auth, error handler)
├── modules/         # Each folder represents an API (e.g. health, users)
│   └── <module>/    
│       ├── <module>.routes.ts      # Defines API endpoints and connects them to controller methods
│       ├── <module>.controller.ts  # Handles requests, validates input, and returns responses
│       ├── <module>.service.ts     # Contains business logic for the API
│       └── index.ts                # Exports the module’s routes for use in app.ts
├── repositories/    # All SQL queries — nothing else
├── types/           # Shared TypeScript types and enums
├── utils/           # Pure helper functions — no DB, no Express
├── lib/
├── app.ts
└── index.ts

prisma/
├── schema.prisma   # datasource, generator, shared enums
├── seed.ts
├── migrations/
└── models/         # split Prisma model files

prisma.config.ts    # points Prisma at the ./prisma directory

tests/
├── unit/         # Unit tests for service/business logic
└── integration/  # Integration tests for API routes/endpoints
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled output |
| `npm run prisma:generate` | Generate Prisma client from the `prisma/` directory schema |
| `npm run prisma:push` | Push schema directly to the database without creating migrations |
| `npm run prisma:migrate:dev` | Create and apply a development migration |
| `npm run prisma:migrate:deploy` | Apply migrations |
| `npm run prisma:seed` | Seed local sample data after setting `ALLOW_SAMPLE_SEED=true` |
| `npm test` | Run Jest tests |

## Prisma Schema Layout

This project uses Prisma's multi-file schema setup.

- `prisma.config.ts` points Prisma at the `./prisma` directory
- `schema.prisma` contains the shared `generator`, `datasource`, and enums
- `prisma/models/*.prisma` contains individual models

Use `npm run prisma:migrate:dev` for normal team development when migration files exist or need to be created. Use `npm run prisma:push` when no migration files are available yet or for prototyping and disposable local database resets.
