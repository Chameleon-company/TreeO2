# API Documentation

---

## 1. Overview

This document defines the structure and documentation standard for all backend APIs in the TreeO2 project.

All APIs follow a module-based architecture.  
Each module represents a single API and contains its own routes, controller, service, and index file.

Swagger is used for interactive API documentation and testing.

Swagger UI:  
http://localhost:3000/api-docs

---

## 2. Module-Based API Structure

All APIs are organised under:

`src/modules/`

Each API has its own folder:

src/modules/
└── <module>/
    ├── <module>.routes.ts
    ├── <module>.controller.ts
    ├── <module>.service.ts
    └── index.ts

---

## 3. What Each File Contains

### <module>.routes.ts
Defines the API endpoints for the module and connects them to controller methods.

Responsibilities:
- Define route paths (e.g. GET /health, POST /users)
- Attach controller methods
- Include Swagger annotations for API documentation

---

### <module>.controller.ts
Handles incoming requests and outgoing responses.

Responsibilities:
- Receive request data
- Validate and parse input where required
- Call the service layer
- Return HTTP responses

Must NOT contain:
- Business logic
- Database queries

---

### <module>.service.ts
Contains the core business logic for the API.

Responsibilities:
- Process data
- Implement business rules
- Interact with repositories or database layer

Must NOT:
- Use Express request/response objects

---

### index.ts
Exports the module routes so they can be used in app.ts.

Acts as the public entry point for the module.

Example:
export { default as healthRoutes } from "./health.routes";

---

## 4. How APIs Are Wired in the App

All module routes are registered in:

`src/app.ts`

Example:
import { healthRoutes } from "./modules/health";
app.use("/health", healthRoutes);

This keeps route registration centralised while keeping implementation modular.

---

## 5. Current API Modules

The backend currently includes the following API modules:

src/modules/
├── adopters
├── adoptions
├── dashboard-widgets
├── health
├── localization
├── partners
├── project-management
├── project-tree-types
├── reports
├── scan-batches
├── tree-scans
├── tree-types
├── user-management
└── user-project-assignment

Each module follows the same internal structure:

<module>/
├── <module>.routes.ts
├── <module>.controller.ts
├── <module>.service.ts
└── index.ts

Total:
- 14 API modules
- 56 files structured consistently across modules

---

## 6. Documentation Rule for New APIs

Whenever a new API is created:

- Use the existing module structure inside `src/modules/`
- Implement logic inside the already created files:
  - `<module>.routes.ts`
  - `<module>.controller.ts`
  - `<module>.service.ts`
  - `index.ts`
- Wire the routes in `app.ts`
- Add Swagger documentation for all endpoints
- Update this file to include the new module

---

## 7. Testing Standard

All modules should include the following test files:

tests/unit/<module>.test.ts  
tests/integration/<module>.test.ts

### Unit Tests
Used to test service/business logic in isolation.

Examples:
- Returned data is correct
- Validation logic works
- Business rules behave as expected

### Integration Tests
Used to test the full API flow:

route → controller → service → response

Examples:
- Correct HTTP status code
- Correct response body
- Endpoint behaves as expected

### Reference Example

Health module includes:

tests/unit/health.test.ts  
tests/integration/health.test.ts

All developers should add or update tests for the module they work on.

---

## 8. Health API

Reference implementation for module structure.

### Endpoints

#### GET /health

Response:
{ "success": true, "status": "OK", "timestamp": "..." }

Flow: routes → controller → service → response

Notes:
- Serves as the standard example for all modules
- Swagger is defined in `health.routes.ts`

---

## 9. Tree Types API

This section documents the `tree-types` module that has now been implemented and tested.

### Purpose

`tree-types` is a master/reference-data module used to manage tree species/type definitions in the backend.

It currently supports:
- listing all tree types
- fetching a single tree type by id
- creating a new tree type
- updating an existing tree type
- deleting a tree type when it is not referenced by dependent records

### Route Base

Current route base:

`/tree-types`

Examples:
- `GET /tree-types`
- `GET /tree-types/:id`
- `POST /tree-types`
- `PUT /tree-types/:id`
- `DELETE /tree-types/:id`

Swagger UI:

`http://localhost:3000/api-docs`

---

### Files Added / Updated

#### Module Files

- `src/modules/tree-types/treeTypes.routes.ts`
- `src/modules/tree-types/treeTypes.controller.ts`
- `src/modules/tree-types/treeTypes.service.ts`
- `src/modules/tree-types/treeTypes.schemas.ts`
- `src/modules/tree-types/treeTypes.docs.ts`
- `src/modules/tree-types/index.ts`

#### Route Registration

- `src/routes/index.ts`

#### Test Files

- `tests/integration/tree-types.test.ts`
- `tests/unit/tree-types.test.ts`

---

### Responsibility of Each File

#### `treeTypes.routes.ts`

Defines all `tree-types` endpoints and applies middleware in the current project pattern.

Current route protection:
- `GET` routes use `authMiddleware`
- `POST`, `PUT`, `DELETE` use `authMiddleware`
- `POST`, `PUT`, `DELETE` also use `roleMiddleware(["ADMIN"])`
- request validation is applied using `validateMiddleware(...)`

#### `treeTypes.controller.ts`

Receives validated requests and returns HTTP responses.

Current controller responsibilities:
- call the service layer
- return status codes
- return standard JSON success response shape

#### `treeTypes.service.ts`

Contains the actual business logic and Prisma usage.

Current service responsibilities:
- fetch tree types from Prisma
- fetch a tree type by id
- create tree type records
- update tree type records
- prevent deletion when referenced
- perform duplicate-key checks in service logic
- log create, update, and delete actions

#### `treeTypes.schemas.ts`

Contains Zod validation schemas for:
- path params
- create body
- update body
- delete params

#### `treeTypes.docs.ts`

Contains Swagger/OpenAPI annotations for:
- GET `/tree-types`
- GET `/tree-types/{id}`
- POST `/tree-types`
- PUT `/tree-types/{id}`
- DELETE `/tree-types/{id}`

Also defines request body schemas so Swagger UI shows body input for POST and PUT.

#### `index.ts`

Exports `treeTypesRoutes` as the module entry point.

#### `src/routes/index.ts`

Registers the module centrally:

`router.use("/tree-types", treeTypesRoutes);`

---

### Request Flow

#### A. GET `/tree-types`

Flow:

`routes -> authMiddleware -> controller -> service -> Prisma -> response`

Detailed flow:
1. request reaches `treeTypes.routes.ts`
2. `authMiddleware` checks bearer token using current auth scaffold
3. controller calls `listTreeTypes()`
4. service fetches tree types using Prisma
5. service maps DB fields to API response shape
6. controller returns `200 OK`

#### B. GET `/tree-types/:id`

Flow:

`routes -> authMiddleware -> validateMiddleware(treeTypeIdSchema) -> controller -> service -> Prisma -> response`

Detailed flow:
1. request reaches route with `:id`
2. `authMiddleware` checks authentication
3. `validateMiddleware` validates `id` as a positive integer
4. controller calls `getTreeTypeById(id)`
5. service fetches record
6. if missing, service throws `404`
7. controller returns `200 OK` when found

#### C. POST `/tree-types`

Flow:

`routes -> authMiddleware -> roleMiddleware(["ADMIN"]) -> validateMiddleware(createTreeTypeSchema) -> controller -> service -> Prisma -> response`

Detailed flow:
1. request reaches create route
2. `authMiddleware` checks authentication
3. `roleMiddleware(["ADMIN"])` checks Admin role using current scaffold
4. `validateMiddleware` validates request body
5. controller calls `createTreeType(payload)`
6. service checks duplicate key if provided
7. service applies default `dry_weight_density = 595` when omitted
8. service creates record using Prisma
9. service logs create action
10. controller returns `201 Created`

#### D. PUT `/tree-types/:id`

Flow:

`routes -> authMiddleware -> roleMiddleware(["ADMIN"]) -> validateMiddleware(updateTreeTypeSchema) -> controller -> service -> Prisma -> response`

Detailed flow:
1. request reaches update route
2. auth is checked
3. admin role is checked
4. request body is validated
5. controller calls `updateTreeType(id, payload)`
6. service checks record exists
7. service checks duplicate key if provided
8. service updates only provided fields
9. service logs update action
10. controller returns `200 OK`

#### E. DELETE `/tree-types/:id`

Flow:

`routes -> authMiddleware -> roleMiddleware(["ADMIN"]) -> validateMiddleware(deleteTreeTypeSchema) -> controller -> service -> Prisma -> response`

Detailed flow:
1. request reaches delete route
2. auth is checked
3. admin role is checked
4. `id` is validated
5. controller calls `deleteTreeType(id)`
6. service checks record exists
7. service checks references in:
   - `projectTreeType`
   - `treeScan`
8. if referenced, service throws `409 Conflict`
9. if safe, service deletes record
10. service logs delete action
11. controller returns `200 OK`

---

### Access Matrix

| Endpoint | Method | Auth Required | Role Required | Notes |
|---|---|---:|---|---|
| `/tree-types` | GET | Yes | Any authenticated role | Returns list |
| `/tree-types/:id` | GET | Yes | Any authenticated role | Returns single record |
| `/tree-types` | POST | Yes | `ADMIN` | Create new tree type |
| `/tree-types/:id` | PUT | Yes | `ADMIN` | Partial update allowed |
| `/tree-types/:id` | DELETE | Yes | `ADMIN` | Blocked if referenced |

Important note:
- access currently depends on the existing scaffolded auth/role middleware
- this module intentionally reuses that scaffold without redesigning it

---

### Tree Type Data Shape

Current API response shape:

```json
{
  "id": 1,
  "name": "Eucalyptus",
  "key": "eucalyptus",
  "scientific_name": "Eucalyptus globulus",
  "dry_weight_density": 650,
  "created_at": "2026-01-28T10:00:00.000Z",
  "updated_at": "2026-01-28T10:00:00.000Z"
}
```

Current business rules:
- `name` is required
- `key` is optional
- `scientific_name` is optional
- `dry_weight_density` is optional
- when omitted on create, `dry_weight_density` defaults to `595`
- delete is blocked when referenced by dependent records

---

### Validation Rules

#### Path Param Validation

`id` must be:
- numeric
- integer
- positive

Invalid examples:
- `abc`
- `0`
- `-1`

#### Create Validation

Accepted body example:

```json
{
  "name": "Eucalyptus",
  "key": "eucalyptus",
  "scientific_name": "Eucalyptus globulus",
  "dry_weight_density": 650
}
```

Rules:
- `name` must be non-empty after trim
- `key` if provided must be non-empty after trim
- `scientific_name` if provided must be non-empty after trim
- `dry_weight_density` if provided must be positive

#### Update Validation

Accepted body example:

```json
{
  "dry_weight_density": 640.5
}
```

Rules:
- partial updates are allowed
- empty body is rejected
- each provided field is validated

---

### Error Cases Handled

The module currently handles:

- missing token -> `401`
- non-admin mutation request -> `403`
- invalid `id` -> `400`
- missing required `name` -> `400`
- blank `name` -> `400`
- invalid `dry_weight_density` -> `400`
- empty update body -> `400`
- record not found -> `404`
- duplicate `key` -> `409`
- delete blocked due to references -> `409`

---

### Sorting Behaviour

Current list sorting:

- tree types are fetched with `orderBy: { name: "asc" }`

This means:
- response order is alphabetical by `name`
- response is not sorted by `id`

If a different sort order is needed later, it should be changed in:

`src/modules/tree-types/treeTypes.service.ts`

---

### Test Coverage Added

Two test files were implemented:

- `tests/integration/tree-types.test.ts`
- `tests/unit/tree-types.test.ts`

No separate schema-only test file was added because the repo does not currently have that as an established convention.

#### A. Integration Tests Covered

These tests exercise:

`route -> middleware -> controller -> service -> Prisma -> Postgres -> response`

Covered scenarios:

##### GET `/tree-types`
- returns `401` when token is missing
- returns `200` for authenticated user
- returns tree type list
- returns empty array when no records exist

##### GET `/tree-types/:id`
- returns `401` when token is missing
- returns `200` when record exists
- returns `400` for `abc`
- returns `400` for `0`
- returns `400` for negative id
- returns `404` when missing

##### POST `/tree-types`
- returns `401` when token is missing
- returns `403` for non-admin user
- returns `201` for admin valid request
- succeeds when only `name` is provided
- applies default density `595`
- returns `400` for missing `name`
- returns `400` for blank `name`
- returns `400` for invalid density
- returns `400` when `name` exceeds DB length limit
- returns `400` when `key` exceeds DB length limit
- returns `400` when `scientific_name` exceeds DB length limit
- returns `409` for duplicate `key`

##### PUT `/tree-types/:id`
- returns `401` when token is missing
- returns `403` for non-admin user
- returns `200` for valid partial update
- updates only provided fields
- returns `400` for invalid id
- returns `400` for empty body
- returns `400` for invalid values
- returns `400` when updated `name` exceeds DB length limit
- returns `400` when updated `key` exceeds DB length limit
- returns `400` when updated `scientific_name` exceeds DB length limit
- returns `404` when missing
- returns `409` for duplicate `key`

##### DELETE `/tree-types/:id`
- returns `401` when token is missing
- returns `403` for non-admin user
- returns success for valid admin delete
- returns `400` for invalid id
- returns `404` when missing
- returns `409` when referenced by `projectTreeType`
- returns `409` when referenced by `treeScan`
- verifies delete is not executed on conflict

#### B. Unit Tests Covered

These tests exercise the service layer directly.

Covered scenarios:

##### `listTreeTypes`
- returns mapped records
- returns empty array

##### `getTreeTypeById`
- returns mapped record
- throws not found when missing

##### `createTreeType`
- succeeds with full payload
- succeeds with only required `name`
- applies default density
- blocks duplicate key

##### `updateTreeType`
- updates only provided fields
- throws not found when record missing

##### `deleteTreeType`
- succeeds when record is not referenced
- blocks delete when referenced by `projectTreeType`
- blocks delete when referenced by `treeScan`

---

### Test Strategy Used

Current test strategy for this module:

- Jest is used as the test runner
- integration tests use `supertest`
- the main `tree-types` integration suite uses the real Prisma client and real Postgres-backed data
- logger is mocked in tests
- integration auth behaviour uses the current development auth scaffold

This matches the current repo state where:
- Jest is already configured
- test files already live under `tests/unit` and `tests/integration`
- CI provisions a Postgres test database and applies the Prisma schema before tests
- the `tree-types` API integration suite creates and cleans up its own test data

---

### How To Run Tree Types Tests

Run unit tests only:

```bash
npm test -- --runInBand tests/unit/tree-types.test.ts
```

Run integration tests only:

```bash
npm test -- --runInBand tests/integration/tree-types.test.ts
```

Run both:

```bash
npm test -- --runInBand tests/unit/tree-types.test.ts tests/integration/tree-types.test.ts
```

---

### Current Limitations

- auth and role checks depend on the existing scaffold and are not fully production-complete yet
- duplicate key protection is currently handled in service logic, not by a visible DB uniqueness constraint
- there is not yet a dedicated `project-tree-types` deletion/assignment workflow connected to this document beyond reference checks

---

### Summary

The `tree-types` module is now fully wired into the backend with:
- route registration
- controller/service separation
- Zod validation
- Swagger documentation
- authenticated read access
- admin-only mutation access
- reference-safe delete behavior
- unit test coverage
- real DB-backed API integration coverage

This module now serves as one of the more complete examples of the project’s current module-based API structure and can be used as a reference for implementing similar CRUD-style master-data APIs.
