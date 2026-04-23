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

## 9. Project Management API

This module manages project records used across the TreeO2 platform. It provides full CRUD operations with validation, role-based access control, and integration with related entities such as countries, locations, and tree scans.

**Module Path:** `src/modules/project-management/`

### Files
- `projectManagement.routes.ts`
- `projectManagement.controller.ts`
- `projectManagement.service.ts`
- `index.ts`

### 9.1 Purpose

The Project Management API is responsible for creating, retrieving, updating, and deleting projects in the system.

Projects are core records used to organise:
- Tree scans
- Locations
- Country-level operations
- Administrative ownership

### 9.2 Architecture Flow

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

### 9.3 Security

All endpoints are protected using Bearer Token authentication.

Middleware used:
- `authMiddleware`
- `roleMiddleware`

### 9.4 Access Control Matrix

| Endpoint | ADMIN | MANAGER | INSPECTOR | FARMER | DEVELOPER |
|---|---|---|---|---|---|
| GET /projects | Yes | Yes | No | No | No |
| GET /projects/{id} | Yes | Yes | No | No | No |
| POST /projects | Yes | No | No | No | No |
| PUT /projects/{id} | Yes | No | No | No | No |
| DELETE /projects/{id} | Yes | No | No | No | No |

### 9.5 Endpoints

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

### 9.6 Validation Rules

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

### 9.7 Error Handling

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

### 9.8 Swagger Documentation

All endpoints are documented in:

`projectManagement.routes.ts`

Available at:

`http://localhost:3000/api-docs`

Swagger supports:
- Interactive testing
- Request examples
- Response definitions
- Security schemas

### 9.9 Testing

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

### 9.10 Summary

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