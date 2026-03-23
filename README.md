# TreeO2 Backend

TreeO2 backend scaffold built with Node.js, TypeScript, Express, Prisma, PostgreSQL, Zod, Winston, and Swagger.

## Current State

This repository is a production-oriented scaffold, not a finished product. It currently provides:

- Express app/bootstrap with security middleware
- Prisma client setup for PostgreSQL
- Zod-based environment validation
- Winston logging
- request/error middleware scaffolding
- route aggregation and module starter folders
- Swagger starter docs

Not yet implemented:

- real JWT login flow
- business logic for TreeO2 modules
- SQS/S3/AWS jobs
- CI workflows
- real tests

## Quick Start

```bash
npm install
cp .env.example .env
docker compose up -d
npx prisma generate
npm run dev
```

Use your own local values in `.env`. Do not commit real credentials or secrets to the repository.

API base URL: `http://localhost:3000/api/v1`

Useful endpoints:

- `GET /api/v1/health`
- `GET /docs`

## Prisma

Generate Prisma client:

```bash
npx prisma generate
```

Create a migration during development:

```bash
npx prisma migrate dev --name init
```

Seed local data:

```bash
npm run prisma:seed
```

## Project Structure

```text
src/
├── app.ts
├── server.ts
├── config/
├── common/
├── lib/
├── middlewares/
├── modules/
└── routes/

prisma/
├── schema.prisma
└── seed.ts
```

## Scripts

- `npm run dev` starts the development server
- `npm run build` compiles TypeScript to `dist/`
- `npm run type-check` runs the TypeScript checker
- `npm run prisma:seed` runs the Prisma seed script

## Notes

- `/auth/login` is intentionally not implemented yet and currently returns `501`.
- The Prisma schema is still minimal and should be expanded with real TreeO2 entities before feature work continues.
- `.env` is local-only and must not be committed.
