import "dotenv/config";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";

const roleArg = process.argv[2]?.toUpperCase() || "ADMIN";
const JWT_SECRET = process.env.JWT_SECRET || "test-secret-test-secret-test-secret-123456";

function generateTestJwt(payload: any) {
    return jwt.sign({ ...payload, jti: randomUUID() }, JWT_SECRET, {
        expiresIn: "24h",
        algorithm: "HS256",
    });
}

let payload;

switch (roleArg) {
    case "ADMIN":
        payload = {
            sub: "1", userId: 1, scope: "identity",
            systemRole: "SystemAdmin", role: "ADMIN", organisations: []
        };
        break;
    case "FARMER":
        payload = {
            sub: "2", userId: 2, scope: "identity", role: "FARMER",
            organisations: [{ organisationId: 1, organisationRole: "Member" }]
        };
        break;
    case "MANAGER":
        payload = {
            sub: "3", userId: 3, scope: "identity", role: "MANAGER",
            organisations: [{ organisationId: 1, organisationRole: "Member" }]
        };
        break;
    case "INSPECTOR":
        payload = {
            sub: "4", userId: 4, scope: "identity", role: "INSPECTOR",
            organisations: [{ organisationId: 1, organisationRole: "Member" }]
        };
        break;
    case "DEVELOPER":
        payload = {
            sub: "5", userId: 5, scope: "identity", role: "DEVELOPER",
            organisations: [{ organisationId: 1, organisationRole: "Member" }]
        };
        break;
    case "ORG_ADMIN":
        payload = {
            sub: "6", userId: 6, scope: "identity", role: "MANAGER",
            organisations: [{ organisationId: 1, organisationRole: "OrganisationAdmin" }]
        };
        break;
    default:
        console.error(`Unknown role: ${roleArg}. Valid roles: ADMIN, FARMER, MANAGER, INSPECTOR, DEVELOPER, ORG_ADMIN`);
        process.exit(1);
}

const token = generateTestJwt(payload);
console.log(`\n=== DEV TOKEN FOR ROLE: ${roleArg} ===\n`);
console.log(`Bearer ${token}\n`);
console.log(`(Expires in 24 hours)\n`);
