# POSTAUTH Cleanup Tasks

This document tracks technical debt, type relaxations, and security bypasses that were intentionally introduced or retained during `Task T2 2026 - AUTH05` to support the legacy development bypass engine (`AUTH_DEV_MODE`). 

**All of these items MUST be strictly enforced once the dev bypass engine is fully removed in the POSTAUTH phase.**

## 1. Strictly Require JWT Timestamps
**File:** `src/modules/auth/auth.types.ts`
**Issue:** `jti`, `iat`, and `exp` are currently marked as `.optional()` in `IdentityJwtPayloadSchema`.
**Reason for relaxation:** The mock tokens in `auth.middleware.ts` (e.g. `AUTH_DEV_ADMIN_TOKEN`) do not contain these fields. If they were made strictly required, the TypeScript compiler would fail on the `devTokenUsers` map.
**POSTAUTH Action:** Remove `.optional()` from these three fields so that the runtime strictly enforces token expiry and replay protection.

## 2. Enforce Strict Enum for Project Roles
**File:** `src/modules/auth/auth.types.ts`
**Issue:** `projectRoles` in `ProjectJwtPayloadSchema` is typed as `z.array(z.string())` instead of `z.array(z.enum(ROLE_NAMES))`.
**Reason for relaxation:** The mock tokens in `auth.middleware.ts` use legacy TitleCase roles (e.g., `"Manager"`), whereas `ROLE_NAMES` is strictly uppercase (e.g., `"MANAGER"`). Enforcing the enum now would break the bypass engine.
**POSTAUTH Action:** Change `projectRoles: z.array(z.string())` to `projectRoles: z.array(z.enum(ROLE_NAMES))` to actively reject garbage role strings at runtime.

## 3. Remove Type Casting (`as Secret`)
**File:** `src/lib/jwt.ts`
**Issue:** `jwt.sign()` and `jwt.verify()` cast the secret using `env.JWT_SECRET as Secret`.
**Reason for relaxation:** In `src/config/env.ts`, `JWT_SECRET` is explicitly made `.optional()` during testing (`isTest`) so that the test suite can run without needing a real 32-character `.env` secret. This results in the type being `string | undefined`, forcing the cast in the implementation.
**POSTAUTH Action:** Refactor the test environment configuration to inject a dummy 32-character secret, remove the `.optional()` relaxation in `env.ts`, and then remove `as Secret` in `jwt.ts`.

## 4. Remove Legacy Role Field and Legacy Payload Schema
**File:** `src/modules/auth/auth.types.ts`
**Issue:** The `role` field is temporarily retained as optional on `IdentityJwtPayloadSchema` and `ProjectJwtPayloadSchema`. Additionally, `LegacyJwtPayloadSchema` is still included in the payload union.
**Reason for relaxation:** Retained to ensure backwards compatibility with legacy branch testing environments and the legacy token payloads until the capability-driven architecture is universally adopted.
**POSTAUTH Action:** Delete the `role` field from the Identity and Project schemas, and completely remove `LegacyJwtPayloadSchema` from the codebase once the systematic migration is complete across all teams.

## 5. Refactor JWT Payloads to use `z.discriminatedUnion()`
**File:** `src/modules/auth/auth.types.ts`
**Issue:** `IdentityJwtPayloadSchema` and `ProjectJwtPayloadSchema` are currently separate schemas.
**Reason for relaxation:** The legacy payloads do not have a literal `scope` property that can act as a discriminator. Because we are retaining backwards compatibility with `LegacyJwtPayloadSchema` during the migration phase, we cannot cleanly transition to a discriminated union yet.
**POSTAUTH Action:** Once the legacy token payloads are fully removed, refactor the JWT validation to use `z.discriminatedUnion("scope", [IdentityJwtPayloadSchema, ProjectJwtPayloadSchema])` to elegantly and strictly narrow token payloads.
