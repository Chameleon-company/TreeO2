# API Guidelines

These guidelines define how APIs should be implemented in the TreeO2 backend.

The goal is consistency across modules, predictable structure, and production-friendly code.

---

## 1. Module Structure

Each API module should follow this structure:

```text
src/modules/<module>/
├── <module>.routes.ts
├── <module>.controller.ts
├── <module>.service.ts
├── <module>.schemas.ts
├── <module>.types.ts          # optional
├── <module>.repository.ts     # optional, only if repository layer is used
└── index.ts
```

Minimum required files for each module:

- `routes`
- `controller`
- `service`
- `index`

Recommended files:

- `schemas`
- `types`

Optional file:

- `repository`

---

## 2. File Naming

Use `camelCase.ts` for file names.

Examples:

- `users.routes.ts`
- `users.controller.ts`
- `users.service.ts`
- `users.schemas.ts`
- `users.types.ts`
- `users.repository.ts`

Do not use:

- `UsersController.ts`
- `usersController.ts`
- `users_route.ts`

---

## 3. Responsibility Rules

### Routes

Routes should only:

- define endpoint paths
- attach middleware
- call controller handlers

Routes must not:

- contain business logic
- contain Prisma queries
- contain validation logic beyond attaching validation middleware

Example:

```ts
router.get('/', authMiddleware, (req, res, next) => {
  void listUsers(req, res).catch(next);
});
```

### Controllers

Controllers should:

- read request params/body/query
- rely on Zod validation
- call service methods
- return HTTP responses

Controllers must not:

- contain Prisma queries directly
- contain complex business logic
- contain reusable domain rules

### Services

Services should:

- contain business logic
- coordinate Prisma/repository calls
- enforce domain rules
- throw `AppError` for known failures

Services must not:

- access `req` or `res`
- return Express responses

### Repositories

If a repository layer is used, it should:

- contain only data access logic
- contain Prisma queries only
- not contain business rules

Repository layer is optional in this project unless the team explicitly decides to use it consistently.

---

## 4. Naming Conventions

### Variables

Use `camelCase`.

Examples:

- `userId`
- `projectId`
- `treeScan`
- `reportStatus`

Boolean variables must start with:

- `is`
- `has`
- `can`

Examples:

- `isActive`
- `hasAccess`
- `canSignIn`

### Functions / Methods

Use `camelCase` and name based on behavior.

Good examples:

- `listUsers`
- `getUserById`
- `createProject`
- `updateTreeScan`
- `archiveReport`
- `getDashboardOverview`

Avoid vague names:

- `handleData`
- `processStuff`
- `doAction`

### Classes / Interfaces / Types

Use `PascalCase`.

Examples:

- `AppError`
- `AuthenticatedUser`
- `CreateProjectInput`

### Constants

Use `SCREAMING_SNAKE_CASE`.

Examples:

- `MAX_PAGE_SIZE`
- `DEFAULT_PAGE_LIMIT`
- `REPORT_QUEUE_NAME`

### Enums

Use `PascalCase` enum names and Prisma-aligned values where applicable.

Examples:

- `UserRole`
- `ReportStatus`

If the enum mirrors Prisma, keep the values exactly aligned with Prisma.

---

## 5. Route Conventions

Use plural resource names for route prefixes.

Examples:

- `/users`
- `/projects`
- `/tree-types`
- `/scan-batches`
- `/tree-scans`

Nested or scope-based routes should remain clear and resource-oriented.

Examples:

- `/projects/:projectId/users`
- `/projects/:projectId/tree-types`

Do not use verbs in route names unless the endpoint is truly action-based.

Prefer:

- `POST /reports`

Instead of:

- `POST /generate-report`

If an action route is required, keep it explicit and limited.

Example:

- `POST /reports/:id/retry`

---

## 6. Controller Method Conventions

Use these common controller method names:

- `list<Resource>`
- `get<Resource>`
- `create<Resource>`
- `update<Resource>`
- `delete<Resource>`

Examples:

- `listProjects`
- `getProject`
- `createProject`
- `updateProject`
- `deleteProject`

For non-CRUD modules, use names based on the actual action:

- `getDashboard`
- `listLocalization`
- `queueReport`
- `downloadReport`

---

## 7. Service Method Conventions

Service names should describe domain behavior, not HTTP behavior.

Good examples:

- `getProjectsOverview`
- `findUserByEmail`
- `createScanBatch`
- `assignUserToProject`
- `generateReport`

Avoid controller-like names in services:

- `sendUsersResponse`
- `handleCreateProject`

---

## 8. Validation Rules

Use Zod for all incoming request validation.

Create validation schemas in `<module>.schemas.ts`.

Validate:

- `body`
- `params`
- `query`

Examples:

- `createUserBodySchema`
- `updateProjectParamsSchema`
- `listReportsQuerySchema`

Prefer explicit, small schemas over one large generic schema.

Attach schemas using `validateMiddleware`.

---

## 9. Response Rules

All API responses should follow a consistent structure:

```ts
{
  success: true,
  data: ...
}
```

For failures:

```ts
{
  success: false,
  message: '...'
}
```

Paginated responses should include:

```ts
{
  success: true,
  data: [...],
  pagination: {
    page,
    limit,
    total,
    totalPages
  }
}
```

Do not return raw Prisma objects if the API contract should differ.

Add mapping/transform logic when necessary.

---

## 10. Error Handling

Use:

- `AppError`
- `ERROR_CODES`

Do not hardcode repeated error strings in controllers/services.

Examples:

```ts
throw new AppError(404, ERROR_CODES.DATA_001);
throw new AppError(403, ERROR_CODES.AUTH_004);
```

Known errors should be thrown in services.

Controllers should pass unexpected errors to the error middleware.

Do not swallow errors silently.

---

## 11. Authentication and Authorization

Authentication rules:

- JWT verification belongs in `auth.middleware.ts`
- controllers should assume `req.user` only exists after auth middleware runs
- do not parse tokens manually inside controllers/services

Authorization rules:

- role checks belong in `role.middleware.ts`
- project-scope checks belong in `projectScope.middleware.ts`
- do not scatter RBAC logic across controllers unless truly module-specific

If an endpoint requires auth, attach middleware in routes, not inside the controller.

---

## 12. Prisma Usage

Use Prisma through:

- `src/lib/prisma.ts`

Do not:

- instantiate a new `PrismaClient` inside feature modules
- duplicate connection setup
- place random Prisma queries in route files

If the module is simple, services may call Prisma directly.

If query logic grows, introduce a module repository file.

---

## 13. Async Rules

Always use `async/await`.

Do not use `.then()` / `.catch()` chains in normal API code.

For async controllers in routes:

```ts
router.get('/', (req, res, next) => {
  void listUsers(req, res).catch(next);
});
```

Use `void` when intentionally not awaiting a promise.

---

## 14. Logging Rules

Use the shared logger from `src/config/logger.ts`.

Do not use:

- `console.log`

Allowed logging examples:

```ts
logger.info('User authenticated', { userId });
logger.warn('Rate limit nearing threshold', { ip });
logger.error('Failed to generate report', { reportId, err });
```

Never log:

- passwords
- JWTs
- raw secrets
- database passwords

---

## 15. Scaffold Rules

If an endpoint/module is scaffold-only:

- make it explicit
- return a clear placeholder response or `501`
- do not fake successful business behavior

Scaffold code should be easy to replace later, not misleading.

---

## 16. Index File Rules

Each module `index.ts` should only export the module’s public pieces.

Typical example:

```ts
import usersRoutes from './users.routes';

export { usersRoutes };
```

Do not place business logic inside `index.ts`.

---

## 17. Testing Expectations

When real API logic is added, corresponding tests should also be added.

At minimum:

- service-level unit tests
- integration tests for important routes

Test names should be clear and behavior-based.

Examples:

- `users.service.test.ts`
- `projects.routes.test.ts`

---

## 18. Suggested Standard for This Project

For this TreeO2 backend, every feature module should eventually include:

- `routes`
- `controller`
- `service`
- `schemas`
- `index`

Add `types` when the module introduces DTOs or internal contracts.

Add `repository` only if the team formally decides to keep Prisma access separate from services.

This should be the default implementation pattern going forward.
