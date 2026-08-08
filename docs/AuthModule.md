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
- Auth-specific TypeScript types and payload interfaces per Specification v1.3 Section 14
- TypeScript Discriminated Union: `type JwtPayload = IdentityJwtPayload | ProjectJwtPayload`
  - `IdentityJwtPayload` (`scope: 'identity'`): Used for authentication, profile lookup (`/auth/me`), and project selection.
  - `ProjectJwtPayload` (`scope: 'project'`): Used for project-scoped operational endpoints, carrying `projectId`, `organisationId`, `organisationRole`, and `projectRoles[]`.
- Removed unspec'd `email` claim to strictly align with Section 14 sample JWT claims.
- Retained optional `role?: RoleName` property for temporary backwards compatibility during migration.
- **Legacy Backward Compatibility:** `LegacyJwtPayloadSchema` is temporarily retained because the `user-management`, `adopters`, and `projects` modules are currently being developed on separate branches against the older v1.2 token model. These modules depend on pulling `req.user.role` (for global checks) and `req.user.projectIds` directly from a single token. They will be refactored to use the new `IdentityJwtPayload` / `ProjectJwtPayload` models during the POSTAUTH phase.

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
- validates Bearer token presence in HTTP `Authorization` header
- verifies JWT signature using secret key
- attaches decoded `JwtPayload` to `req.user`

Current temporary development support (`AUTH_DEV_MODE=true`):
- when `NODE_ENV=development` and `AUTH_DEV_MODE=true`, local fixed dev tokens can be used for protected API testing
- supported dev tokens (7 spec-compliant payloads):
  - `Bearer dev-admin-token` (`scope: 'identity'`, `systemRole: 'SystemAdmin'`)
  - `Bearer dev-support-admin-token` (`scope: 'identity'`, `systemRole: 'SupportAdmin'`)
  - `Bearer dev-org-admin-token` (`scope: 'project'`, `organisationRole: 'OrganisationAdmin'`, `projectId: 1`)
  - `Bearer dev-manager-token` (`scope: 'project'`, `projectId: 1`, `projectRoles: ['Manager']`)
  - `Bearer dev-inspector-token` (`scope: 'project'`, `projectId: 1`, `projectRoles: ['Inspector']`)
  - `Bearer dev-farmer-token` (`scope: 'project'`, `projectId: 1`, `projectRoles: ['Farmer']`)
  - `Bearer dev-developer-token` (`scope: 'project'`, `projectId: 1`, `projectRoles: ['Developer']`)
- if no dev token matches, normal JWT verification applies

### `src/middleware/role.middleware.ts`

Purpose:
- legacy role check middleware checking `req.user.role`
- guarded with optional chaining to support the new `JwtPayload` Discriminated Union without breaking legacy routes

### `src/middleware/projectScope.middleware.ts`

Purpose:
- cryptographic token scope gatekeeper per Specification v1.3 Section 15
- **Deprecation of `x-project-id` Header:** Client-supplied HTTP headers are completely ignored to prevent header spoofing vulnerabilities.
- **Scope Enforcement:** Requires `req.user.scope === 'project'`. If an Identity Access Token (`scope: 'identity'`) is sent to a project route, returns `403 Forbidden` (`AUTH_004: Invalid token scope for project route`).
- **Context Attachment:** Extracts cryptographically signed `req.user.projectId` and populates `req.projectScope = { projectId }` for downstream controllers.
- **Route Wiring:** Attached after `authMiddleware` across operational project routes (`/tree-scans`, `/scan-batches`, `/project-tree-types`).

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

## Development-Only Auth Mode

This repository currently supports a temporary local auth mode to allow protected API development before full auth is implemented.

Required conditions:
- `NODE_ENV=development`
- `AUTH_DEV_MODE=true`

Supported local bearer tokens:
- `Bearer dev-admin-token`
- `Bearer dev-support-admin-token`
- `Bearer dev-org-admin-token`
- `Bearer dev-manager-token`
- `Bearer dev-inspector-token`
- `Bearer dev-farmer-token`
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
- verify project-scope middleware behavior per Section 15 of v1.3 spec

Expected behavior:
- no token -> `401`
- token with `scope === 'identity'` -> `403` (`AUTH_004: Invalid token scope`)
- Project-Scoped token (`scope === 'project'`) with valid `projectId` -> `200`

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
