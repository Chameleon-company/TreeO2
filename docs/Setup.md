# Setup Guide

## Prerequisites

Make sure the following are installed on your system:

- Node.js (v20 or above)
- npm (v10 or above)
- Docker
- Docker Compose

---

## Local Setup

Follow these steps to run the project locally:

```bash
npm install
cp .env.example .env
docker compose up -d
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev
```

### If Database Connection Fails

If you encounter Prisma errors (for example: P1000 authentication failed), reset the database:

```bash
docker compose down -v
docker compose up -d
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev
```

Base API URL: `http://localhost:3000/api/v1`

### Environment Variables

Important environment variables used in the project:

DATABASE_URL – PostgreSQL connection string
JWT_SECRET – Secret key for signing JWT tokens
JWT_EXPIRES_IN – Token expiry duration
JWT_ISSUER – Token issuer identifier
JWT_AUDIENCE – Token audience
API_PREFIX – Base API prefix (e.g., /api/v1)


## Database

This project now uses Prisma instead of raw SQL bootstrap scripts.

Useful commands:

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

Notes
- Currently using prisma db push because the schema is still evolving.
- `npx prisma migrate dev --name init` will create the first local migration from the current Prisma schema when you are ready to begin tracking migrations.

### Seed Data

The seed script currently creates a default admin user for development purposes.

Note: Authentication is not fully implemented yet. Seed data is only for initial setup and testing.

## Current Limits

- login/authentication is scaffolded but not implemented
- only starter module routes exist
- tests and CI are still placeholders
