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


## 9. USER MANAGEMENT API

This module manages users with role-based and project-based access control.

Module Path: `src/modules/user-management/`

---

### 9.1 Access Control

| Endpoint          | ADMIN | MANAGER (Scoped) | INSPECTOR | FARMER |
|------------------|-------|------------------|-----------|--------|
| GET /users       | Yes   | Yes              | No        | No     |
| GET /users/:id   | Yes   | Yes (project)    | Self      | Self   |
| POST /users      | Yes   | No               | No        | No     |
| PUT /users/:id   | Yes   | Yes (restricted) | No        | No     |
| DELETE /users/:id| Yes   | No               | No        | No     |

---

### 9.2 Manager Restrictions

Managers CAN:
- Update users within assigned projects

Managers CANNOT:
- Update roleId
- Update accountActive
- Update canSignIn

---

### 9.3 Validation Rules

- email must be valid format
- email must be unique (409)
- roleId must exist
- projectIds must:
  - be valid IDs
  - not contain duplicates

---

### 9.4 Endpoints

#### GET /users
Fetch users (Admin full access, Manager scoped by project)

#### GET /users/:id
Fetch single user with role-based access control

#### POST /users
Create user (Admin only)

#### PUT /users/:id
Update user (Admin full, Manager scoped with restrictions)

#### DELETE /users/:id
Soft delete user (Admin only)

---

### 9.5 Response Codes

- 200 OK
- 201 Created
- 400 Validation error
- 401 Unauthorized
- 403 Forbidden
- 404 Not found
- 409 Conflict

---

### 9.6 Business Logic

- Prisma-based data access
- Soft delete (disable user instead of removing)
- Role-based access control (RBAC)
- Project-scoped access for MANAGER
- Prevent deletion if user linked to treeScan records
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

## 10. Project Management API

This module manages project records used across the TreeO2 platform. It provides full CRUD operations with validation, role-based access control, and integration with related entities such as countries, locations, and tree scans.

**Module Path:** `src/modules/project-management/`

### Files
- `projectManagement.routes.ts`
- `projectManagement.controller.ts`
- `projectManagement.service.ts`
- `index.ts`

### 10.1 Purpose

The Project Management API is responsible for creating, retrieving, updating, and deleting projects in the system.

Projects are core records used to organise:
- Tree scans
- Locations
- Country-level operations
- Administrative ownership

### 10.2 Architecture Flow

Every request follows the standard backend module structure:

```text
Route → Controller → Service → Prisma ORM → PostgreSQL → Response
```

#### Responsibilities

#### Routes
- Define endpoints
- Apply authentication middleware
- Apply role-based authorization
- Contain Swagger documentation

#### Controller
- Receive request data
- Read params/body
- Call service methods
- Return HTTP response

#### Service
- Perform validation
- Apply business rules
- Execute database queries
- Throw structured errors

### 10.3 Security

All endpoints are protected using Bearer Token authentication.

Middleware used:
- `authMiddleware`
- `roleMiddleware`

### 10.4 Access Control Matrix

| Endpoint | ADMIN | MANAGER | INSPECTOR | FARMER | DEVELOPER |
|---|---|---|---|---|---|
| GET /projects | Yes | Yes | No | No | No |
| GET /projects/{id} | Yes | Yes | No | No | No |
| POST /projects | Yes | No | No | No | No |
| PUT /projects/{id} | Yes | No | No | No | No |
| DELETE /projects/{id} | Yes | No | No | No | No |

### 10.5 Endpoints

#### GET /projects

Retrieve all projects ordered by newest first.

##### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Reforestation Project",
      "description": "Tree planting initiative",
      "countryId": 1,
      "adminLocationId": 10,
      "isActive": true
    }
  ]
}
```

##### Status Codes
- `200` Success
- `401` Authentication required
- `403` Insufficient permissions

#### GET /projects/{id}

Retrieve a single project by ID.

##### Path Parameters

| Name | Type | Required |
|---|---|---|
| id | integer | Yes |

##### Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Reforestation Project",
    "description": "Tree planting initiative",
    "countryId": 1,
    "adminLocationId": 10,
    "isActive": true
  }
}
```

##### Status Codes
- `200` Success
- `400` Invalid project ID
- `401` Authentication required
- `403` Insufficient permissions
- `404` Project not found

#### POST /projects

Create a new project.

##### Request Body
```json
{
  "name": "Reforestation Project",
  "description": "Tree planting initiative",
  "countryId": 1,
  "adminLocationId": 10,
  "isActive": true
}
```

##### Required Fields
- `name`
- `countryId`
- `adminLocationId`

##### Response
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Reforestation Project"
  }
}
```

##### Status Codes
- `201` Created
- `400` Invalid payload
- `401` Authentication required
- `403` Insufficient permissions
- `404` Country or location not found
- `409` Duplicate record

#### PUT /projects/{id}

Update an existing project.

##### Path Parameters

| Name | Type | Required |
|---|---|---|
| id | integer | Yes |

##### Request Body
Any subset of fields may be provided.

```json
{
  "name": "Updated Project",
  "description": "Expanded planting scope",
  "countryId": 1,
  "adminLocationId": 12,
  "isActive": false
}
```

##### Response
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Updated Project"
  }
}
```

##### Status Codes
- `200` Success
- `400` Invalid request / empty payload / invalid ID
- `401` Authentication required
- `403` Insufficient permissions
- `404` Project, country, or location not found
- `409` Duplicate record

#### DELETE /projects/{id}

Delete a project.

##### Path Parameters

| Name | Type | Required |
|---|---|---|
| id | integer | Yes |

##### Response
```json
{
  "success": true,
  "data": {
    "message": "Project deleted successfully"
  }
}
```

##### Status Codes
- `200` Success
- `400` Invalid project ID
- `401` Authentication required
- `403` Insufficient permissions
- `404` Project not found
- `409` Cannot delete project with dependent scans

### 10.6 Validation Rules

#### Create Validation
- Name must be a non-empty string
- `countryId` must be a positive integer
- `adminLocationId` must be a positive integer
- `isActive` must be boolean if provided

#### Update Validation
- At least one field must be provided
- Fields must match correct data types
- IDs must be positive integers

#### Relationship Validation
- Country must exist
- Location must exist
- Admin location must belong to selected country

#### Delete Validation
- Project must exist
- Project cannot be deleted if linked scans exist

### 10.7 Error Handling

Uses centralised error middleware.

#### Standard Error Response
```json
{
  "success": false,
  "message": "Project not found"
}
```

#### Common Errors
- Authentication required
- Insufficient permissions
- Invalid project ID
- Missing required fields
- Duplicate project
- Country not found
- Location not found
- Empty update payload
- Project has dependent scans
- Internal server error

### 10.8 Swagger Documentation

All endpoints are documented in:

`projectManagement.routes.ts`

Available at:

`http://localhost:3000/api-docs`

Swagger supports:
- Interactive testing
- Request examples
- Response definitions
- Security schemas

### 10.9 Testing

#### Test Files
- `tests/unit/project-management.test.ts`
- `tests/integration/project-management.test.ts`

#### Covered Scenarios

##### Authentication
- No token returns `401`

##### Authorization
- Allowed roles succeed
- Blocked roles return `403`

##### Read
- Get all projects
- Get project by ID
- Get missing project returns `404`

##### Create
- Valid project created
- Invalid payload rejected
- Missing country rejected

##### Update
- Valid update succeeds
- Empty payload rejected
- Missing project rejected

##### Delete
- Valid delete succeeds
- Missing project rejected
- Protected delete blocked when dependencies exist

### 10.10 Summary

The Project Management API follows the TreeO2 backend engineering standard:

- Modular architecture
- Secure authentication
- Role-based access control
- Clean separation of concerns
- Strong validation
- Full CRUD support
- Swagger documentation
- Automated tests
- Scalable structure for future enhancements

---

## 11. Localization API

This module manages localized string resources used across the TreeO2 platform. It provides read and administrative write operations for multilingual content with context filtering, language fallback support, and role-based access control.

**Module Path:** `src/modules/localization/`

### Files
- `localization.routes.ts`
- `localization.controller.ts`
- `localization.service.ts`
- `index.ts`

### 11.1 Purpose

The Localization API is responsible for creating, retrieving, updating, and deleting localized strings in the system.


### 11.2 Architecture Flow

Every request in this module follows a simple class-based flow:

```text
localization.routes.ts (Router + middleware)
→ LocalizationController
→ LocalizationService
→ Prisma Client
→ PostgreSQL
→ Response
```

#### Responsibilities

#### Router (`localization.routes.ts`)
- Defines localization endpoints
- Applies `authMiddleware` and `roleMiddleware`
- Calls `LocalizationController` methods

#### `LocalizationController`
- Receive request data
- Validate params, query, and body
- Call `LocalizationService`
- Return HTTP responses

#### `LocalizationService`
- Applies localization business rules
- Reads and writes localized strings via Prisma
- Returns data or throws handled errors

### 11.3 Security

All endpoints are protected using Bearer Token authentication.

Middleware used:
- `authMiddleware`
- `roleMiddleware`

### 11.4 Access Control Matrix

| Endpoint | ADMIN | MANAGER | INSPECTOR | FARMER | DEVELOPER |
|---|---|---|---|---|---|
| GET /localized-strings | Yes | Yes | Yes | Yes | Yes |
| POST /localized-strings | Yes | No | No | No | No |
| PUT /localized-strings/{id} | Yes | No | No | No | No |
| DELETE /localized-strings/{id} | Yes | No | No | No | No |

### 11.5 Endpoints

#### GET /localized-strings

Retrieve localized strings with optional filters.

Supports both camelCase and snake_case query aliases for language and string key filters.

##### Query Parameters

| Name | Type | Required | Notes |
|---|---|---|---|
| context | enum(API, MOBILE, ADMIN, PUBLIC) | No | Context filter |
| preferredLanguage / preferred_language | string | No | Preferred language code |Fallback language code (defaults to `en-US`) |
| stringKeys / string_keys | string or string[] | No | Comma-separated or repeated list of keys |

##### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "cultureCode": "en-US",
      "stringKey": "treeTypes.mango.name",
      "value": "Mango",
      "context": "API"
    }
  ]
}
```

##### Status Codes
- `200` Success
- `400` Invalid query filters
- `401` Authentication required
- `403` Insufficient permissions

#### POST /localized-strings

Create a localized string.

##### Request Body
```json
{
  "cultureCode": "en-US",
  "stringKey": "treeTypes.oak.name",
  "value": "Oak",
  "context": "API"
}
```

##### Required Fields
- `cultureCode`
- `stringKey`
- `value`
- `context`

##### Response
```json
{
  "success": true,
  "data": {
    "id": 2,
    "cultureCode": "en-US",
    "stringKey": "treeTypes.oak.name",
    "value": "Oak",
    "context": "API"
  }
}
```

##### Status Codes
- `201` Created
- `400` Invalid payload / culture not found
- `401` Authentication required
- `403` Insufficient permissions
- `500` Duplicate localized string currently maps to internal server error

#### PUT /localized-strings/{id}

Update an existing localized string.

##### Path Parameters

| Name | Type | Required |
|---|---|---|
| id | integer | Yes |

##### Request Body
Any subset of fields may be provided, but at least one field is required.

```json
{
  "value": "Acajou",
  "cultureCode": "fr-FR"
}
```

##### Response
```json
{
  "success": true,
  "data": {
    "id": 2,
    "cultureCode": "fr-FR",
    "stringKey": "treeTypes.mahogany.name",
    "value": "Acajou",
    "context": "API"
  }
}
```

##### Status Codes
- `200` Success
- `400` Invalid request / empty payload / invalid ID / culture not found
- `401` Authentication required
- `403` Insufficient permissions
- `404` Localized string not found

#### DELETE /localized-strings/{id}

Delete a localized string.

##### Path Parameters

| Name | Type | Required |
|---|---|---|
| id | integer | Yes |

##### Response
```json
{
  "success": true,
  "message": "Localized string deleted successfully"
}
```

##### Status Codes
- `200` Success
- `400` Invalid localized string ID
- `401` Authentication required
- `403` Insufficient permissions
- `404` Localized string not found

### 11.6 Validation Rules

#### List Validation
- `preferredLanguage` / `preferred_language` must be non-empty strings (max 10).
- `context` must be one of `API`, `MOBILE`, `ADMIN`, `PUBLIC`
- `stringKeys` / `string_keys` can be a single string, comma-separated string, or array of strings

#### Create Validation
- `cultureCode` must be a non-empty string (max 10)
- `stringKey` must be a non-empty string (max 255)
- `value` must be a non-empty string
- `context` must be one of `API`, `MOBILE`, `ADMIN`, `PUBLIC`
- `cultureCode` must exist in the `culture` table

#### Update Validation
- `id` must be a positive integer
- At least one field must be provided
- Provided fields must match expected types and limits
- If `cultureCode` is provided, it must exist

#### Delete Validation
- `id` must be a positive integer
- Target localized string must exist

### 11.7 Error Handling

Uses centralised error middleware.

#### Standard Error Response
```json
{
  "success": false,
  "message": "DATA_001: Resource not found"
}
```

#### Common Errors
- Authentication required (`AUTH_003`)
- Insufficient permissions (`AUTH_004`)
- Validation failed (`VAL_001`)
- Invalid request body (for missing culture) (`VAL_002`)
- Resource not found (`DATA_001`)
- Internal server error (`SYS_001`)

### 11.8 Swagger Documentation

All endpoints are documented in:

`localization.routes.ts`

Available at:

`http://localhost:3000/api-docs`

Swagger supports:
- Interactive testing
- Request examples
- Response definitions
- Security schemas

### 11.9 Testing

#### Test Files
- `tests/unit/localization.test.ts`
- `tests/integration/localization.test.ts`

#### Covered Scenarios

##### Authentication
- No token returns `401`

##### Authorization
- Allowed roles succeed on read
- Blocked roles return `403` on write

##### Read
- Get localized strings with filters
- Preferred language resolution with fallback language
- Unknown endpoint returns `404`

##### Create
- Valid localized string created
- Invalid payload rejected
- Missing culture rejected
- Duplicate create path returns current mapped `500`

##### Update
- Valid update succeeds
- Invalid ID rejected
- Empty payload rejected
- Missing target rejected
- Missing new culture rejected

##### Delete
- Valid delete succeeds
- Missing target rejected

### 11.10 Summary

The Localization API follows the TreeO2 backend engineering standard:

- Modular architecture
- Secure authentication
- Role-based access control
- Clean separation of concerns
- Strong validation with Zod
- Language fallback support
- Swagger documentation
- Automated tests
- Scalable structure for multilingual expansion
