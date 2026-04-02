# Code Guidelines

---

## 1. Toolchain

- **ESLint** — enforces code correctness
- **Prettier** — enforces formatting
- **Husky** — runs lint and format check before every commit
- **Docker / Docker Compose** — standardises local development setup for backend + PostgreSQL

```bash
npm run validate      # run all checks before opening a PR
npm run lint:fix      # auto-fix lint issues
npm run format        # auto-format source files
```

---

## Local Development with Docker

For local development, Docker Compose can be used to run PostgreSQL and the backend together.

Use:
docker compose up --build

This setup automates Prisma client generation, schema push, and backend startup.

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
| Enums | `PascalCase` | `UserRole.Admin` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_LOGIN_ATTEMPTS` |
| Type aliases | `PascalCase` | `ReportStatus` |
| Unused parameters | prefix `_` | `_next`, `_req` |
| SQL migrations | `NNN_description.sql` | `001_initial_schema.sql` |

Boolean variables and functions should start with `is`, `has`, or `can`:
```ts
isActive, hasPermission, canSignIn
```

---

## 4. Folder Structure

```
src/
├── config/          # env, database pool, logger, swagger config
├── middleware/      # Express middleware (auth, error handler)
├── modules/         # Each folder represents an API (e.g. health, users)
├── repositories/    # All SQL queries — nothing else
├── types/           # Shared TypeScript types and enums
├── utils/           # Pure helper functions — no DB, no Express
├── app.ts
└── index.ts
```

### What belongs where
**Modules** — each folder represents one API and contains its routes, controller, service, and index file.

**Repositories** — SQL queries only. No business logic, no error throwing (return `null` for not found).


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

---

## 7. Error Handling

Use `AppError` for all known errors. Always use the constants from `types/errorCodes.ts` — never hardcode error strings:

```ts
import { ERROR_CODES } from './types/errorCodes';

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

Services throw, repositories return `null`. Only controllers call `res.json()`. The error handler middleware takes care of error responses.

Never swallow errors silently:

```ts
// No
} catch (_err) {}

// Yes
} catch (err: unknown) {
  logger.error('Something failed', { err });
  throw new AppError(500, 'SYS_001: Internal server error');
}
```

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

Validate all incoming data with Zod in the controller. A `ZodError` is caught by the error handler and automatically returns a `400`.

---

## 9. API Documentation (Swagger)

All endpoints must be documented using Swagger annotations.

Swagger UI is available at: http://localhost:3000/api-docs

Every new route must include:
- Summary
- Request params / body
- Response format

Do not merge PRs with undocumented endpoints.

---

## 10. Database

TODO by Database Team



---

## 11. Logging

Use `logger` from `config/logger.ts`. Never use `console.log`.

```ts
logger.error('Failed to process report', { reportId, err });
logger.warn('Deprecated endpoint called', { url: req.url });
logger.info('User authenticated', { userId: user.id });
logger.debug('Query result', { rows: result.rows });
```

Never log sensitive data like passwords or tokens.

---

## 12. Git

### 12.1 Branching Strategy

We follow a structured Git workflow with username-prefixed branches:

Branch | Purpose
--

main | Stable shared branch
<username>/feature/<name> | New features
<username>/fix/<name> | Bug fixes
<username>/chore/<name> | Maintenance tasks

Examples:
tina/feature/user-authentication  
tina/fix/login-error  

Rules:
- Always prefix branch names with your username
- Use lowercase letters and hyphens (-) only
- Keep branch names short but descriptive
- Never commit directly to main
- Always create your branch from the latest main

Example:
git checkout main  
git pull origin main  
git checkout -b tina/feature/user-authentication  

---

### 12.2 Commit Messages

Use clear and consistent commit messages:

feat: add user authentication  
fix: handle null user response  
refactor: simplify user service logic  
chore: update eslint config  
docs: update API guidelines  

---

### 12.3 Pull Requests (PRs)

All changes must go through a Pull Request into main.

PR Requirements:
- Must pass npm run validate
- Must follow project structure and coding guidelines
- Must not contain console.log statements or commented-out code
- Must include a clear description of:
  - what was done
  - why it was done
  - any important notes
- Must include screenshots or proof of working functionality
- Code must be running without errors before submission

Example PR Description:

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

---

### 12.4 Code Review & Approval Flow

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
4. Only the Project Lead performs the final merge into main  

---

### 12.5 Merging

- Only the Project Lead is allowed to merge PRs into main
- Use squash and merge to keep commit history clean
- Delete the branch after merging

Example:
git branch -d tina/feature/user-authentication  

---

### 12.6 Keeping Branches Updated

Before opening a PR, pull the latest main and sync your branch:

git checkout main  
git pull origin main  
git checkout tina/feature/your-branch  
git merge main  

Resolve conflicts locally before pushing.

---

### 12.7 Forbidden Practices

Do not:
- commit directly to main
- push broken code
- commit sensitive data such as API keys or passwords
- use --force on shared branches
- leave unused code or debug logs

---

### 12.8 Good Practices

Always:
- pull the latest changes before starting work
- keep commits small and meaningful
- use descriptive branch names
- test your code before committing

