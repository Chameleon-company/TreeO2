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
- forgot-password flow
- reset-password flow
- current-user lookup
- Prisma-backed user and role queries
- password verification
- JWT issuance in live auth flow

All unfinished auth service methods currently return `501 Not Implemented` safely.

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
- password reset flow
- current-user retrieval

### `src/modules/auth/auth.repository.ts`

Contains:
- auth-related database access layer
- Prisma access point for auth queries

Future responsibility:
- find user by email/id
- fetch roles
- update password hash
- store/reset tokens if needed

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
1. request body is validated
2. controller calls service
3. service throws `501`
4. global error handler returns response

### Reset Password

`POST /auth/reset-password`

Flow:
1. request body is validated
2. controller calls service
3. service throws `501`
4. global error handler returns response

### Me

`GET /auth/me`

Flow:
1. bearer token is verified
2. JWT payload is attached to `req.user`
3. controller calls service
4. service throws `501`
5. global error handler returns response

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
