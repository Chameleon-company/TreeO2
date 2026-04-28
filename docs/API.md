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

This module manages users in the TreeO2 system. It supports user creation, retrieval, updating, and soft deletion with role-based and project-based access control.

**Module Path:** `src/modules/user-management/`

### Files

* `userManagement.routes.ts`
* `userManagement.controller.ts`
* `userManagement.service.ts`
* `index.ts`

### 9.1 Purpose

Manages system users for authentication, authorization, project assignment, and tree scan ownership.

### 9.2 Architecture Flow

```text
Route → Controller → Service → Prisma → Database → Response
```

### 9.3 Security

* JWT authentication required
* Middleware:

  * `authMiddleware`
  * `roleMiddleware`

### 9.4 Access Control

| Endpoint          | ADMIN | MANAGER       | INSPECTOR | FARMER |
| ----------------- | ----- | ------------- | --------- | ------ |
| GET /users        | Yes   | Yes           | No        | No     |
| GET /users/:id    | Yes   | Project-based | Self      | Self   |
| POST /users       | Yes   | No            | No        | No     |
| PUT /users/:id    | Yes   | No            | No        | No     |
| DELETE /users/:id | Yes   | No            | No        | No     |

### 9.5 Endpoints

#### GET /users

Fetch all users (optional project filter)

#### GET /users/:id

Fetch user by ID with role-based access

#### POST /users

Create user (ADMIN only)

#### PUT /users/:id

Update user (ADMIN only)

#### DELETE /users/:id

Soft delete user (ADMIN only)

### 9.6 Business Logic

* Prisma-based database operations
* Role and project-based access control
* Soft delete (disable account instead of removing)
* Prevent deletion if linked to `treeScan`

### 9.7 Response Codes

* 200 Success
* 201 Created
* 400 Bad Request
* 401 Unauthorized
* 403 Forbidden
* 404 Not Found

### 9.8 Swagger

Defined in `userManagement.routes.ts`
Available at: `http://localhost:3000/api-docs`

### 9.9 Testing

* Unit tests: service logic
* Integration tests: full API flow (route → controller → service)

### 9.10 Summary

* Modular architecture
* Secure authentication
* Role-based access control
* Soft delete system
* Clean separation of concerns
* Fully tested and documented API
