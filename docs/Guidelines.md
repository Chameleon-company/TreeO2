# Code Guidelines

---

## 1. Toolchain

- **ESLint** — enforces code correctness
- **Prettier** — enforces formatting
- **Husky** — runs lint and format check before every commit

```bash
npm run validate      # run all checks before opening a PR
npm run lint:fix      # auto-fix lint issues
npm run format        # auto-format source files
```

---

## 2. Formatting

Prettier handles all formatting automatically. You should never manually fix spacing, quotes, or indentation.

Run this to format all files in `src/`:

```bash
npm run format
```

Run this to check formatting without writing any changes (used in CI):

```bash
npm run format:check
```

If Prettier and ESLint are both flagging the same file, always run lint first then format:

```bash
npm run lint:fix
npm run format
```

The pre-commit hook runs both automatically on staged files before every commit, so if you forget, the commit will fix it or block it for you.

---

## 3. Naming

| Thing | Convention | Example |
|---|---|---|
| Files | `camelCase.ts` | `userService.ts` |
| Variables & functions | `camelCase` | `getUserById` |
| Classes & interfaces | `PascalCase` | `AppError`, `AuthenticatedUser` |
| Enums | `PascalCase` | `UserRole.ADMIN` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_LOGIN_ATTEMPTS` |
| Type aliases | `PascalCase` | `ReportStatus` |
| Unused parameters | prefix `_` | `_next`, `_req` |
| SQL migrations | `NNN_description.sql` | `001_initial_schema.sql` |

Boolean variables and functions should start with `is`, `has`, or `can`:

```ts
isActive, hasPermission, canSignIn
```

When enums mirror Prisma enums, keep the enum values aligned exactly with Prisma values.

---

## 4. Folder Structure

Current scaffolded structure:

```text
src/
├── config/          # env, logger, rate limit, Swagger
├── common/          # shared enums, types, errors, helpers, interfaces
├── lib/             # Prisma, JWT, bcrypt, external clients
├── middlewares/     # Express middleware
├── modules/         # feature modules; currently mostly route scaffolds, later controllers/services
├── routes/          # top-level route aggregation
├── app.ts
└── server.ts

prisma/
├── schema.prisma
├── seed.ts
└── migrations/
```

Target module shape as feature work grows:

```text
src/modules/<module>/
├── <module>.routes.ts
├── <module>.controller.ts
├── <module>.service.ts
├── <module>.schemas.ts
└── index.ts
```

### What belongs where

**Routes** — URL path + which controller function handles it. Nothing else.

Always wrap async controllers with a non-async arrow function and `void` when needed. Express route handlers expect a `void` return, not a `Promise` — passing an async function directly can trigger `no-misused-promises`.

```ts
// No
router.get('/:id', getUser);

// Yes
router.get('/:id', (req, res, next) => {
  void getUser(req, res, next);
});
```

**Controllers** — parse and validate `req`, call a service, return `res`. No Prisma query logic, no business rules.

```ts
export async function getUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const user = await getUserById(id);
    res.json({ success: true, data: user });
  } catch (err: unknown) {
    next(err);
  }
}
```

**Services** — business logic only. Call Prisma or other libraries, throw `AppError` on failure. No `req/res`.

```ts
export async function getUserById(id: number): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new AppError(404, ERROR_CODES.DATA_001);
  }

  return user;
}
```

**Shared libraries (`src/lib`)** — reusable runtime helpers such as Prisma, JWT, password hashing, and future AWS clients.

**Common (`src/common`)** — shared enums, DTOs, interfaces, errors, and helpers. Shared enums and DTOs must match the Prisma schema or explicit API contracts.

**Prisma** — schema and seeding belong in `prisma/`. Do not scatter schema definitions or connection logic throughout feature modules.

### Current scaffold note

Most modules currently only contain route scaffolding. That is intentional. Do not make placeholder endpoints look production-ready if they are not implemented yet.

---

## 5. Async/Await

Always use `async/await`. Never use `.then()` or `.catch()` chains.

```ts
// No
getUser(id).then((user) => res.json(user)).catch((err) => next(err));

// Yes
const user = await getUser(id);
res.json({ success: true, data: user });
```

When a promise is intentionally not awaited (e.g. at the top level), mark it explicitly with `void`:

```ts
void start();
```

---

## 6. TypeScript

Strict mode is on. Don't work around it.

```ts
// No
const data: any = response;
const id = user!.id;

// Yes
const data: unknown = response;
const id = user?.id;
```

Always type parameters and return values on exported functions:

```ts
// No
export async function getUser(id) { ... }

// Yes
export async function getUser(id: number): Promise<User | null> { ... }
```

Use `unknown` for caught errors, not `any`:

```ts
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  logger.error(message);
}
```

Use Express request augmentation for auth/project-scope metadata instead of ad hoc casting.

---

## 7. Error Handling

Use `AppError` for all known errors. Always use the constants from `src/common/errors/errorCodes.ts` — never hardcode error strings.

```ts
throw new AppError(404, ERROR_CODES.DATA_001);
throw new AppError(403, ERROR_CODES.AUTH_004);
```

Error code format: `CATEGORY_NNN: human readable message`

| Prefix | Use for |
|---|---|
| `AUTH_` | Authentication and authorisation |
| `VAL_` | Validation failures |
| `DATA_` | Not found, conflicts |
| `SYS_` | Unexpected system errors |

Services throw. Controllers and middleware pass errors to the central error middleware. Only controllers call `res.json()` for successful responses.

Never swallow errors silently:

```ts
// No
} catch (_err) {}

// Yes
} catch (err: unknown) {
  logger.error('Something failed', { err });
  throw new AppError(500, ERROR_CODES.SYS_001);
}
```

For scaffold-only endpoints, prefer a clear `501` response with an explicit error/message over fake success behavior.

---

## 8. API Responses

All responses follow the `ApiResponse<T>` shape:

```ts
// Success
res.status(200).json({ success: true, data: user });

// Created
res.status(201).json({ success: true, data: tree });

// Paginated
res.status(200).json({
  success: true,
  data: trees,
  pagination: { page: 1, limit: 20, total: 142, totalPages: 8 },
});
```

HTTP status codes:

| Code | When |
|---|---|
| `200` | Successful GET, PATCH, DELETE |
| `201` | Successful POST |
| `400` | Validation error |
| `401` | Not authenticated |
| `403` | Not authorised |
| `404` | Resource not found |
| `409` | Conflict (duplicate, state mismatch) |
| `500` | Unexpected error |
| `501` | Scaffold exists but implementation is intentionally pending |

Validate all incoming data with Zod. `ZodError` is caught by the error middleware and automatically returns a `400`.

Document scaffold-only endpoints clearly when they return placeholders or `501`.

---

## 9. Database

The project now uses Prisma as the primary database access layer.

Rules:

- Use Prisma client from `src/lib/prisma.ts`
- Keep schema changes in `prisma/schema.prisma`
- Generate client after schema changes with `npx prisma generate`
- Keep seed logic in `prisma/seed.ts`
- Do not reintroduce raw `pg` query code into feature modules unless there is a documented exception

Current state:

- The Prisma schema is still minimal
- Migrations are not yet fully established in the repository
- `prisma db push` may still be used locally while the schema evolves

TODO by Database Team:

- expand the schema to match TreeO2 entities
- formalize migration workflow
- add indexes and data notes under `database/`

---

## 10. Logging

Use `logger` from `src/config/logger.ts`. Never use `console.log`.

```ts
logger.error('Failed to process report', { reportId, err });
logger.warn('Deprecated endpoint called', { url: req.url });
logger.info('User authenticated', { userId: user.id });
logger.debug('Query result', { rows: result.rows });
```

Never log sensitive data like passwords or tokens.

Request/response logging should go through the request logger middleware instead of ad hoc controller logging.

---

## 11. Git

### 11.1 Branching Strategy

We follow a structured Git workflow with username-prefixed branches:

| Branch | Purpose |
|---|---|
| `main` | Stable shared branch |
| `<username>/feature/<name>` | New features |
| `<username>/fix/<name>` | Bug fixes |
| `<username>/chore/<name>` | Maintenance tasks |

Examples:

- `tina/feature/user-authentication`
- `tina/fix/login-error`

Rules:

- Always prefix branch names with your username
- Use lowercase letters and hyphens (`-`) only
- Keep branch names short but descriptive
- Never commit directly to `main`
- Always create your branch from the latest `main`

Example:

```bash
git checkout main
git pull origin main
git checkout -b tina/feature/user-authentication
```

---

### 11.2 Commit Messages

Use clear and consistent commit messages:

- `feat: add user authentication`
- `fix: handle null user response`
- `refactor: simplify user service logic`
- `chore: update eslint config`
- `docs: update API guidelines`

---

### 11.3 Pull Requests (PRs)

All changes must go through a Pull Request into `main`.

PR Requirements:

- Must pass `npm run validate`
- Must follow project structure and coding guidelines
- Must not contain `console.log` statements or commented-out code
- Must include a clear description of:
  - what was done
  - why it was done
  - any important notes
- Must include screenshots or proof of working functionality where relevant
- Code must be running without errors before submission

Example PR Description:

```md
### Summary
Added user authentication with JWT.

### Changes
- Created auth controller and service
- Added login endpoint
- Integrated password hashing

### Testing / Proof
- Application runs without errors
- Screenshots attached below

### Notes
Requires JWT_SECRET in environment variables
```

If the PR is scaffold-only, say so explicitly and call out which routes/features are still placeholders.

---

### 11.4 Code Review & Approval Flow

All PRs must go through a structured review process before merging.

Review Process:

- Each PR must be reviewed by two reviewers:
  1. Respective Team Lead or Co-Lead
  2. GitHub Lead or Co-Lead

Responsibilities:

- Reviewers must check:
  - Code quality and readability
  - Naming conventions
  - Error handling
  - Whether the feature works correctly (based on screenshots/proof)

Approval Flow:

1. Developer creates PR with required details and screenshots
2. Two reviewers approve the PR
3. Once approved, Team Leads and GitHub Leads must notify the Project Lead by commenting on the PR
4. Only the Project Lead performs the final merge into `main`

---

### 11.5 Merging

- Only the Project Lead is allowed to merge PRs into `main`
- Use squash and merge to keep commit history clean
- Delete the branch after merging

Example:

```bash
git branch -d tina/feature/user-authentication
```

---

### 11.6 Keeping Branches Updated

Before opening a PR, pull the latest `main` and sync your branch:

```bash
git checkout main
git pull origin main
git checkout tina/feature/your-branch
git merge main
```

Resolve conflicts locally before pushing.

---

### 11.7 Forbidden Practices

Do not:

- commit directly to `main`
- push broken code
- commit sensitive data such as API keys or passwords
- use `--force` on shared branches
- leave unused code or debug logs

---

### 11.8 Good Practices

Always:

- pull the latest changes before starting work
- keep commits small and meaningful
- use descriptive branch names
- test your code before committing
