# Prisma Schema and Seed Data Guide

This note explains how I expect us to work with Prisma schema files and seed data in this project.

The goal is simple:

- keep the Prisma schema easy to maintain as the project grows
- avoid schema conflicts when multiple people are editing models
- make local sample data predictable and safe to use in development

---

## 1. Prisma Schema Layout

This project uses Prisma's multi-file schema setup.

The source of truth is the full `prisma/` directory, not only `prisma/schema.prisma`.

Current structure:

```text
prisma/
├── schema.prisma
├── seed.ts
├── migrations/
└── models/
    ├── adopter.prisma
    ├── report.prisma
    ├── scanBatch.prisma
    └── ...
```

`prisma.config.ts` points Prisma to `./prisma`, so Prisma reads the whole folder as one schema.

### What goes in `prisma/schema.prisma`

I want `prisma/schema.prisma` to stay limited to shared Prisma configuration:

- `generator`
- `datasource`
- shared enums

### What goes in `prisma/models/*.prisma`

Each model should live in its own file under `prisma/models/`.

Examples:

- `report.prisma` for `Report`
- `scanBatch.prisma` for `ScanBatch`
- `adopter.prisma` for `Adopter`

This keeps the schema easier to review and reduces merge conflicts when different people are working on different parts of the data model.

---

## 2. How I Expect Schema Changes To Be Done

If you need to change the database schema:

1. update the relevant model file in `prisma/models/`
2. update `prisma/schema.prisma` only if the change is about shared enums or Prisma config
3. generate the Prisma client
4. apply schema changes to the local database
5. verify the app still works

Recommended commands:

```bash
npm run prisma:generate
```

Then choose one:

```bash
npm run prisma:migrate:dev
```

Use this when:

- migration files already exist
- you are making a normal team change
- you want the schema history tracked properly

Or:

```bash
npm run prisma:push
```

Use this only when:

- migration files do not exist yet
- you are doing quick local sync/prototyping
- the database is disposable

I do not want `db push` to become the default team workflow if migrations are available.

---

## 3. Local Run Flow

For normal local development, I expect this flow:

```bash
docker compose up -d postgres
npm run prisma:generate
npm run prisma:migrate:dev
npm run dev
```

If migration files do not exist yet:

```bash
docker compose up -d postgres
npm run prisma:generate
npm run prisma:push
npm run dev
```

Important:

- if the backend runs locally, `DATABASE_URL` should use `localhost`
- if the backend runs inside Docker Compose, `DATABASE_URL` should use `postgres`

---

## 4. What The Seed Script Is For

`prisma/seed.ts` is for local sample data only.

It gives us a usable local database with:

- sample users
- sample roles
- sample projects
- sample tree scans
- sample adopters and adoptions
- sample reports

This is meant to help with local testing, demos, and development flow. It is not meant to create production data.

---

## 5. How The Seed Works

The seed script inserts or updates records in a controlled order so relations can be created safely.

In simple terms, it does this:

1. checks whether it is allowed to run
2. reads sample passwords from environment variables or fallback defaults
3. prepares the final password hashes before opening the main database transactions
4. inserts shared reference data such as countries, cultures, roles, and tree types
5. inserts or updates users
6. links users to roles and projects
7. inserts scans, audits, adopters, adoptions, and reports

The seed is intentionally split into smaller transaction phases instead of one large transaction:

- phase 1: reference data
- phase 2: users and user relationships
- phase 3: scans, adopters, adoptions, and reports

I want it structured this way so the seed is more durable on reruns and does not depend on one long interactive Prisma transaction staying open.

The script is designed to be safer on rerun than a naive seed:

- it avoids fragile hardcoded autoincrement IDs for the main entities
- it uses deterministic lookups where possible
- it fails loudly if duplicate rows would make the result ambiguous
- it resets user token fields on rerun
- it keeps expensive bcrypt work outside the main write transactions

---

## 6. Seed Safety Rules

I added a few guardrails intentionally.

The sample seed will only run when:

- `ALLOW_SAMPLE_SEED=true`
- `NODE_ENV` is `development` or `test`

This is there to reduce the chance of someone loading demo data into the wrong environment.

It also reduces the chance of transaction timeout issues, because the seed no longer keeps password work and all record creation inside one single long-running transaction.

Run the seed with:

```bash
ALLOW_SAMPLE_SEED=true npm run prisma:seed
```

Recommended full sequence:

```bash
docker compose up -d postgres
npm run prisma:generate
npm run prisma:migrate:dev
ALLOW_SAMPLE_SEED=true npm run prisma:seed
```

If there are no migrations yet:

```bash
docker compose up -d postgres
npm run prisma:generate
npm run prisma:push
ALLOW_SAMPLE_SEED=true npm run prisma:seed
```

---

## 7. How User Passwords Are Handled In Seed Data

For sample users, the seed does not store plain-text passwords in the database.

Instead:

1. it reads a password value from `.env` if you provide one
2. otherwise it falls back to the default sample password
3. before the main write transactions start, it checks whether the existing seeded user already has a matching password hash
4. if the password is unchanged, it keeps the existing hash
5. if the password changed, it hashes the new password using `bcrypt`
6. it stores only `passwordHash` in the database

Available password override variables:

- `SEED_ADMIN_PASSWORD`
- `SEED_MANAGER_PASSWORD`
- `SEED_INSPECTOR1_PASSWORD`
- `SEED_INSPECTOR2_PASSWORD`
- `SEED_FARMER1_PASSWORD`
- `SEED_FARMER2_PASSWORD`
- `SEED_DEVELOPER_PASSWORD`

Example:

```env
ALLOW_SAMPLE_SEED=true
SEED_ADMIN_PASSWORD=MyLocalAdminPassword123
```

That means the seeded admin user can sign in with `MyLocalAdminPassword123`, but the database will still store only the bcrypt hash.

The seed also avoids regenerating a new hash on every rerun if the configured password has not changed. That keeps reruns more stable and avoids unnecessary writes to seeded users.

---

## 8. Important Expectations For Seed Data

I want the seed to stay predictable and local-friendly.

Please keep these rules in mind:

- do not add production-only assumptions into the sample seed
- do not use the seed as a substitute for proper migrations
- do not hardcode fragile numeric IDs for autoincrement models
- do not commit real secrets or real user credentials
- do not assume the sample seed should run in staging or production-like environments

If a change makes the seed depend on a very specific dirty local DB state, that is a smell and should be cleaned up.

---

## 9. Validation I Expect Before A PR

If you touched Prisma schema or seed data, I expect these checks:

```bash
npx prisma validate
npm run prisma:generate
npm run type-check
npm run type-check:seed
```

`npm run type-check:seed` is important here because `prisma/seed.ts` sits outside the normal `src/` TypeScript include path. I added that dedicated check so seed-only type errors do not slip through unnoticed.

If your database is running and you changed seed behavior, also run:

```bash
ALLOW_SAMPLE_SEED=true npm run prisma:seed
```

If you changed schema models, also make sure the database was updated using either:

```bash
npm run prisma:migrate:dev
```

or:

```bash
npm run prisma:push
```

depending on the situation.

---

## 10. Final Rule Of Thumb

If the change is about structure, put it in the schema.

If the change is about sample/demo records, put it in the seed.

If the change is about real database history, use migrations.

That separation is what will keep Prisma manageable for us over time.
