# TreeO2 Backend API

RESTful API for the TreeO2 tree tracking platform — built for xpand Foundation.

## Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **ORM / Data Access**: Prisma
- **Database**: PostgreSQL (Docker for local dev)
- **Auth**: JWT (Bearer token)
- **Validation**: Zod
- **Logging**: Winston
- **API Documentation**: Swagger / OpenAPI
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

# 4. Generate Prisma client
npx prisma generate --schema ./prisma

# 5. Push schema to local DB
npx prisma db push --schema ./prisma

# 6. Seed local data
npm run prisma:seed

# 7. Start dev server
npm run dev
```

API is available at `http://localhost:3000`  
Health check: `GET /health`
Swagger docs: `http://localhost:3000/api-docs`

## Project Structure

```
src/
├── config/          # env, database pool, logger, swagger config
├── middleware/      # Express middleware (auth, error handler)
├── routes/          # URL definitions and middleware attachment only
├── controllers/     # Handle req/res, validate input, call services
├── services/        # Business logic, call repositories
├── repositories/    # All SQL queries — nothing else
├── types/           # Shared TypeScript types and enums
├── utils/           # Pure helper functions — no DB, no Express
├── lib/
├── app.ts
└── index.ts

database/
├── migrations/    # SQL schema files
└── seeds/         # Sample data

prisma/
├── schema.prisma
├── seed.ts
├── migrations/
└── models/

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
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:push` | Push schema to the local database |
| `npm run prisma:migrate:dev` | Create and apply a development migration |
| `npm run prisma:migrate:deploy` | Apply migrations |
| `npm run prisma:seed` | Seed local data |
| `npm test` | Run Jest tests |
