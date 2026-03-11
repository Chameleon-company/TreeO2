# TreeO2 Backend API

RESTful API for the TreeO2 tree tracking platform — built for xpand Foundation.

## Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **Database**: PostgreSQL (Docker for local dev)
- **Auth**: JWT (Bearer token)
- **Validation**: Zod
- **Logging**: Winston
- **Cloud**: AWS Elastic Beanstalk + SQS + S3

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET (min 32 chars)

# 3. Start Postgres
docker compose up -d

# 4. Run migrations - TODO
docker exec -i treeo2_postgres psql -U treeo2_user -d treeo2 \
  < database/migrations/001_initial_schema.sql

# 5. Seed data - TODO
docker exec -i treeo2_postgres psql -U treeo2_user -d treeo2 \
  < database/seeds/001_seed.sql

# 6. Start dev server
npm run dev
```

API is available at `http://localhost:3000`  
Health check: `GET /health`

## Project Structure

```
src/
├── config/          # env, database pool, logger
├── middleware/      # Express middleware (auth, error handler)
├── routes/          # URL definitions and middleware attachment only
├── controllers/     # Handle req/res, validate input, call services
├── services/        # Business logic, call repositories
├── repositories/    # All SQL queries — nothing else
├── types/           # Shared TypeScript types and enums
├── utils/           # Pure helper functions — no DB, no Express
├── app.ts
└── index.ts

database/
├── migrations/    # SQL schema files
└── seeds/         # Sample data

tests/
├── unit/
└── integration/
```



## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled output |
| `npm test` | Run Jest tests |

