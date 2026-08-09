# Auth Module

## Purpose

This document tracks the current structure and implementation state of the authentication and authorization module.

It is intended to be updated as the auth APIs are implemented over time, including:
- login
- logout
- forgot-password
- reset-password
- current-user (`me`)
- role-based access control
- project-scoped authorization

---

## Current Status

The auth module is currently **scaffolded only**.

What exists now:
- auth routes
- auth controller
- auth service
- auth repository
- request validation schemas
- auth-specific types
- Swagger placeholder docs
- JWT helper
- bcrypt helper
- auth/role/project-scope/security middleware scaffolding

What is **not** implemented yet:
- real login
- real logout/session invalidation
- current-user lookup
- Prisma-backed user and role queries (beyond forgot/reset password)
- password verification
- JWT issuance in live auth flow

`forgot-password` and `reset-password` are implemented (Task AUTH09) — a single-use token is generated on request, hashed and stored on the user record, and consumed on reset. Refresh-token revocation on reset is deferred to Task AUTH08 (see `// TODO` in `auth.service.ts`). The remaining unfinished auth service methods (`login`, `logout`, `me`) still return `501 Not Implemented` safely.

Temporary development support:
- a development-only auth mode is available through `auth.middleware.ts`
- when `NODE_ENV=development` and `AUTH_DEV_MODE=true`, fixed local bearer tokens can be used for protected route development
- this is intended only to unblock API development until real auth is implemented

---

## Folder Structure

```text
src/
├── modules/
│   └── auth/
│       ├── auth.routes.ts
│       ├── auth.controller.ts
│       ├── auth.service.ts
│       ├── auth.repository.ts
│       ├── auth.schemas.ts
│       ├── auth.types.ts
│       ├── auth.docs.ts
│       └── index.ts
├── middleware/
│   ├── auth.middleware.ts
│   ├── role.middleware.ts
│   ├── projectScope.middleware.ts
│   ├── validate.middleware.ts
│   └── securityAudit.middleware.ts
└── lib/
    ├── jwt.ts
    └── bcrypt.ts
```

---

## File Explanation

### `src/modules/auth/auth.routes.ts`

Contains:
- route definitions for auth endpoints
- route-level validation middleware
- auth middleware on protected auth routes

Current endpoints:
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/me`
- `GET /auth/test/protected`
- `GET /auth/test/admin`
- `GET /auth/test/project-scope`

### `src/modules/auth/auth.controller.ts`

Contains:
- request/response handling for auth endpoints
- calls into the auth service

Current state:
- delegates to the service layer
- no real auth response logic yet

### `src/modules/auth/auth.service.ts`

Contains:
- auth business-logic layer

Current state:
- methods intentionally throw `501 Not Implemented`

Future responsibility:
- credential verification
- JWT creation
- user lookup
- current-user retrieval

Implemented (Task AUTH09):
- password reset flow (`forgotPassword`, `resetPassword`) — see the Forgot Password / Reset Password sections below

### `src/modules/auth/auth.repository.ts`

Contains:
- auth-related database access layer
- Prisma access point for auth queries

Future responsibility:
- fetch roles

Implemented (Task AUTH09):
- find user by email (`findUserByEmail`)
- store/consume reset tokens (`setResetToken`, `findUserByValidResetTokenHash`)
- update password hash (`updatePasswordAndClearResetToken`)

### `src/modules/auth/auth.schemas.ts`

Contains:
- Zod validation schemas for auth requests

Current schemas:
- login
- forgot-password
- reset-password

### `src/modules/auth/auth.types.ts`

Contains:
- auth-specific TypeScript types
- string role names
- JWT payload type
- request body types

### `src/modules/auth/auth.docs.ts`

Contains:
- Swagger/OpenAPI placeholder documentation for auth endpoints

### `src/modules/auth/index.ts`

Contains:
- single public entry point export for the auth module

Purpose:
- keeps module imports clean and consistent with the agreed project convention

---

## Middleware Explanation

### `src/middleware/auth.middleware.ts`

Purpose:
- validates bearer token presence
- verifies JWT
- attaches payload to `req.user`

Current temporary development support:
- if `AUTH_DEV_MODE=true` and the app is running in development mode
- the middleware accepts fixed local dev tokens:
  - `dev-admin-token`
  - `dev-farmer-token`
  - `dev-manager-token`
  - `dev-inspector-token`
  - `dev-developer-token`
- these tokens attach a dev user payload to `req.user`
- if no dev token matches, normal JWT verification still runs

### `src/middleware/role.middleware.ts`

Purpose:
- checks whether the authenticated user has one of the allowed roles

### `src/middleware/projectScope.middleware.ts`

Purpose:
- placeholder for project-scoped authorization
- currently reads `x-project-id` and stores it on `req.projectScope`

### `src/middleware/validate.middleware.ts`

Purpose:
- validates request body/query/params using Zod

### `src/middleware/securityAudit.middleware.ts`

Purpose:
- adds `requestId`
- logs security-relevant request details

---

## Helper Libraries

### `src/lib/jwt.ts`

Purpose:
- central JWT sign/verify helper

Current state:
- scaffold helper is ready
- verification is usable
- real token issuance is not wired into auth flow yet

### `src/lib/bcrypt.ts`

Purpose:
- password hash and compare helper

Current state:
- helper exists
- not yet connected to real login/reset flows

---

## Current Request Flow

### Login

`POST /auth/login`

Flow:
1. request reaches auth route
2. request body is validated with Zod
3. controller calls service
4. service throws `501`
5. global error handler returns response

### Logout

`POST /auth/logout`

Flow:
1. request reaches auth route
2. `auth.middleware.ts` verifies JWT
3. controller calls service
4. service throws `501`
5. global error handler returns response

### Forgot Password

`POST /auth/forgot-password`

Flow:
1. request body is validated (`email`)
2. service looks up the user by email
3. if no user is found, the endpoint still returns a generic success response (prevents account enumeration)
4. if found, a random single-use token is generated; only its SHA-256 hash is persisted on `users.reset_token`, with a 30-minute expiry in `users.reset_token_expires`
5. the raw token is currently logged, not emailed — no email provider is wired up yet (see `// TODO` in `auth.service.ts`)
6. controller returns `200` with a generic message

### Reset Password

`POST /auth/reset-password`

Flow:
1. request body is validated (`token`, `password`)
2. service hashes the submitted token and looks up a user with a matching, unexpired `reset_token`
3. no match → `400 AUTH_005` (invalid/expired token)
4. match → new password is bcrypt-hashed and saved, and `reset_token`/`reset_token_expires` are cleared (single-use)
5. refresh-token revocation on reset is deferred to Task AUTH08 (see `// TODO` in `auth.service.ts`)
6. controller returns `200` with a generic message

### Me

`GET /auth/me`

Flow:
1. bearer token is verified
2. JWT payload is attached to `req.user`
3. controller calls service
4. service throws `501`
5. global error handler returns response

---

## Development-Only Auth Mode

This repository currently supports a temporary local auth mode to allow protected API development before full auth is implemented.

Required conditions:
- `NODE_ENV=development`
- `AUTH_DEV_MODE=true`

Supported local bearer tokens:
- `Bearer dev-admin-token`
- `Bearer dev-farmer-token`
- `Bearer dev-manager-token`
- `Bearer dev-inspector-token`
- `Bearer dev-developer-token`

Purpose:
- allow API teams to continue testing protected endpoints
- allow role middleware testing before real login is implemented
- avoid adding unsafe fake login endpoints

Important:
- this is local development support only
- it must not be treated as the final authentication implementation
- when `AUTH_DEV_MODE=false`, the dev tokens must be rejected and normal JWT verification must apply

---

## Auth Test Endpoints

The auth module currently includes protected test endpoints to verify middleware behavior before and after enabling development-only auth mode.

### `GET /auth/test/protected`

Purpose:
- verify basic auth middleware behavior

Expected behavior:
- no token -> `401`
- invalid token -> `401`
- valid dev token with `AUTH_DEV_MODE=true` -> `200`

### `GET /auth/test/admin`

Purpose:
- verify role middleware behavior

Expected behavior:
- no token -> `401`
- non-admin authenticated user -> `403`
- admin dev token with `AUTH_DEV_MODE=true` -> `200`

### `GET /auth/test/project-scope`

Purpose:
- verify project-scope middleware behavior

Expected behavior:
- no token -> `401`
- missing or invalid `x-project-id` -> `403`
- valid authenticated user plus valid `x-project-id` -> `200`

---

## Planned Next Updates

This document should be updated when we implement:
- Prisma-backed auth repository queries
- real login flow
- password hashing checks
- JWT issuance
- logout behavior
- forgot/reset password flow
- role lookup from Prisma role model
- project-scoped authorization rules
- auth API request/response examples
