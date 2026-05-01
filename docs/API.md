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