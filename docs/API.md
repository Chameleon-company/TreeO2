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

## 7. Health API

Reference implementation for module structure.

### Endpoints

#### GET /health

Response:
{ "success": true, "status": "OK", "timestamp": "..." }

Flow: routes → controller → service → response

Notes:
- Serves as the standard example for all modules
- Swagger is defined in `health.routes.ts`