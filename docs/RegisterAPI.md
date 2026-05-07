# User Registration API

**Endpoint:** `POST /auth/register`

---

## Request Body

```json
{
  "name": "John Farmer",
  "email": "john@treeo2.com",
  "password": "Secure@1234",
  "role": "FARMER"
}
```

| Field    | Type   | Rules                                                            |
| -------- | ------ | ---------------------------------------------------------------- |
| name     | string | Min 1, Max 100                                                   |
| email    | string | Valid email, Max 300, unique                                     |
| password | string | Min 8, Max 72, must include uppercase, number, special character |
| role     | string | FARMER, INSPECTOR, MANAGER, ADMIN, DEVELOPER                     |

---

## Responses

| Code | Description                  |
| ---- | ---------------------------- |
| 201  | User registered successfully |
| 400  | Validation failed            |
| 409  | Email already exists         |

---

## Flow

1. Validate request body (Zod)
2. Check for duplicate email
3. Verify role exists in DB
4. Hash password (bcrypt)
5. Create user in DB
6. Return safe user response (no password hash)

---

## Tests

**Unit tests** — `tests/unit/auth.test.ts`

- Successful registration
- Duplicate email → 409
- Role not found → 400
- Password hash not in response

**Integration tests** — `tests/integration/auth.test.ts`

- Valid registration → 201
- Missing fields → 400
- Weak password → 400
- Invalid role → 400
- Duplicate email → 409
- Password not exposed in response

---

## Notes

- Roles table must be seeded before registration works
- Password is hashed using bcrypt and never returned in any response
- All error responses include a `requestId` for traceability
- Swagger docs available at `http://localhost:3000/api-docs`
