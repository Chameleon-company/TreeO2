# Code Guidelines

## Architecture

Use the current scaffolded structure:

```text
src/
├── config/        # env, logger, rate limit, Swagger
├── common/        # shared enums, types, errors, helpers
├── lib/           # Prisma, JWT, bcrypt, external clients
├── middlewares/   # auth, validation, request logging, errors
├── modules/       # feature modules; currently mostly route scaffolds, later controllers/services
├── routes/        # top-level route aggregation
├── app.ts
└── server.ts
```

## Rules

- Keep controllers thin.
- Put shared runtime helpers under `src/lib`.
- Keep request validation in Zod schemas.
- Use `AppError` and `ERROR_CODES` for known failures.
- Match shared enums and DTOs to the Prisma schema or explicit API contracts.
- Do not add placeholder business logic that looks production-ready when it is not.
- Document scaffold-only endpoints clearly when they return placeholders or `501`.

## Current Conventions

- TypeScript strict mode stays enabled.
- Prettier controls formatting.
- ESLint warnings are treated as failures.
- Route handlers may be synchronous or async, but errors must flow to middleware.

## Auth

- `auth.middleware.ts` should only verify JWTs.
- real login logic must validate users from Prisma-backed storage.
- do not reintroduce mock token issuance outside explicit local-only development tooling.

## Prisma

- Use Prisma client from `src/lib/prisma.ts`.
- Keep schema changes in `prisma/schema.prisma`.
- Generate client after schema changes with `npx prisma generate`.
