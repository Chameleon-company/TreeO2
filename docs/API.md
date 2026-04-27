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

## 9. Localization API

This module manages localized string resources used across the TreeO2 platform. It provides read and administrative write operations for multilingual content with context filtering, language fallback support, and role-based access control.

**Module Path:** `src/modules/localization/`

### Files
- `localization.routes.ts`
- `localization.controller.ts`
- `localization.service.ts`
- `index.ts`

### 9.1 Purpose

The Localization API is responsible for creating, retrieving, updating, and deleting localized strings in the system.


### 9.2 Architecture Flow

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

### 9.3 Security

All endpoints are protected using Bearer Token authentication.

Middleware used:
- `authMiddleware`
- `roleMiddleware`

### 9.4 Access Control Matrix

| Endpoint | ADMIN | MANAGER | INSPECTOR | FARMER | DEVELOPER |
|---|---|---|---|---|---|
| GET /localized-strings | Yes | Yes | Yes | Yes | Yes |
| POST /localized-strings | Yes | No | No | No | No |
| PUT /localized-strings/{id} | Yes | No | No | No | No |
| DELETE /localized-strings/{id} | Yes | No | No | No | No |

### 9.5 Endpoints

#### GET /localized-strings

Retrieve localized strings with optional filters.

Supports both camelCase and snake_case query aliases for language and string key filters.

##### Query Parameters

| Name | Type | Required | Notes |
|---|---|---|---|
| cultureCode | string | No | Max 10 chars |
| context | enum(API, MOBILE, ADMIN, PUBLIC) | No | Context filter |
| preferredLanguage / preferred_language | string | No | Preferred language code |
| fallbackLanguage / fallback_language | string | No | Fallback language code (defaults to `en-US`) |
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

### 9.6 Validation Rules

#### List Validation
- `cultureCode`, `preferredLanguage`, and `fallbackLanguage` must be non-empty strings (max 10)
- `context` must be one of `API`, `MOBILE`, `ADMIN`, `PUBLIC`
- `stringKeys` can be a single string, comma-separated string, or array of strings

#### Create Validation
- `cultureCode` must be a non-empty string (max 10)
- `stringKey` must be a non-empty string (max 255)
- `value` must be a non-empty string
- `context` must be a non-empty string (max 50)
- `cultureCode` must exist in the `culture` table

#### Update Validation
- `id` must be a positive integer
- At least one field must be provided
- Provided fields must match expected types and limits
- If `cultureCode` is provided, it must exist

#### Delete Validation
- `id` must be a positive integer
- Target localized string must exist

### 9.7 Error Handling

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

### 9.8 Swagger Documentation

All endpoints are documented in:

`localization.routes.ts`

Available at:

`http://localhost:3000/api-docs`

Swagger supports:
- Interactive testing
- Request examples
- Response definitions
- Security schemas

### 9.9 Testing

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

### 9.10 Summary

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