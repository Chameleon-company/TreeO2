import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "test-secret-test-secret-test-secret-123456";

function generateTestJwt(payload: any) {
    return jwt.sign({ ...payload, jti: randomUUID() }, JWT_SECRET, {
        expiresIn: "15m",
        algorithm: "HS256",
    });
}

// Generate valid v1.3 spec Identity JWTs
process.env.AUTH_DEV_ADMIN_TOKEN = generateTestJwt({
    sub: "1",
    userId: 1,
    scope: "identity",
    systemRole: "SystemAdmin",
    role: "ADMIN",
    organisations: []
});

process.env.AUTH_DEV_FARMER_TOKEN = generateTestJwt({
    sub: "2",
    userId: 2,
    scope: "identity", // MUST be identity for v1.3 spec! The old bypass used project
    role: "FARMER",
    organisations: [{ organisationId: 1, organisationRole: "Member" }]
});

process.env.AUTH_DEV_MANAGER_TOKEN = generateTestJwt({
    sub: "3",
    userId: 3,
    scope: "identity",
    role: "MANAGER",
    organisations: [{ organisationId: 1, organisationRole: "Member" }]
});

process.env.AUTH_DEV_INSPECTOR_TOKEN = generateTestJwt({
    sub: "4",
    userId: 4,
    scope: "identity",
    role: "INSPECTOR",
    organisations: [{ organisationId: 1, organisationRole: "Member" }]
});

process.env.AUTH_DEV_DEVELOPER_TOKEN = generateTestJwt({
    sub: "5",
    userId: 5,
    scope: "identity",
    role: "DEVELOPER",
    organisations: [{ organisationId: 1, organisationRole: "Member" }]
});

process.env.AUTH_DEV_ORG_ADMIN_TOKEN = generateTestJwt({
    sub: "6",
    userId: 6,
    scope: "identity",
    role: "MANAGER", // fallback
    organisations: [{ organisationId: 1, organisationRole: "OrganisationAdmin" }]
});

process.env.AUTH_DEV_SUPPORT_ADMIN_TOKEN = generateTestJwt({
    sub: "7",
    userId: 7,
    scope: "identity",
    systemRole: "SupportAdmin",
    role: "MANAGER", // fallback
    organisations: []
});
