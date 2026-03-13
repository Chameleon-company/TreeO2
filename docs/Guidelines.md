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
```

### What belongs where

**Routes** — URL path + which controller function handles it. Nothing else.

Always wrap async controllers with a non-async arrow function and `void`. Express route handlers expect a `void` return, not a `Promise` — passing an async function directly will cause a `no-misused-promises` lint error.

```ts
// No
router.get('/:id', getUser);

// Yes
router.get('/:id', (req, res, next) => {
  void getUser(req, res, next);
});
```

**Controllers** — parse and validate `req`, call a service, return `res`. No SQL, no business logic.
```ts
export async function getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const user = await getUserById(id);
    res.json({ success: true, data: user });
  } catch (err: unknown) {
    next(err);
  }
}
```

**Services** — business logic only. Call repositories, throw `AppError` on failure. No `req/res`.
```ts
export async function getUserById(id: number): Promise<User> {
  const user = await findUserById(id);
  if (!user) import { ERROR_CODES } from './types/errorCodes';

throw new AppError(404, ERROR_CODES.DATA_001);
  return user;
}
```

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

## 9. Database

TODO by Database Team



---

## 10. Logging

Use `logger` from `config/logger.ts`. Never use `console.log`.

```ts
logger.error('Failed to process report', { reportId, err });
logger.warn('Deprecated endpoint called', { url: req.url });
logger.info('User authenticated', { userId: user.id });
logger.debug('Query result', { rows: result.rows });
```

Never log sensitive data like passwords or tokens.

---

## 11. Git
