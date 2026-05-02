import {
  afterAll,
  afterEach,
  describe,
  expect,
  it,
} from "@jest/globals";
import "dotenv/config";
import request from "supertest";
import { PrismaClient } from "@prisma/client";

process.env.NODE_ENV = "development";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require("../../src/app").default;

const prisma = new PrismaClient();

const TOKENS = {
  ADMIN: process.env.AUTH_DEV_ADMIN_TOKEN!,
  MANAGER: process.env.AUTH_DEV_MANAGER_TOKEN!,
  INSPECTOR: process.env.AUTH_DEV_INSPECTOR_TOKEN!,
  FARMER: process.env.AUTH_DEV_FARMER_TOKEN!,
  DEVELOPER: process.env.AUTH_DEV_DEVELOPER_TOKEN!,
};

describe("Localization API", () => {
  const testKeyPrefix = "it.localization.";
  const defaultCultureCode = "en-US";
  const preferredCultureCode = "fr-FR";
  const primaryCultureCode = "tst-INT1";
  const secondaryCultureCode = "tst-INT2";

  const authHeader = (token: string) => ({
    Authorization: `Bearer ${token}`,
  });

  afterEach(async () => {
    await prisma.localizedString.deleteMany({
      where: {
        stringKey: {
          startsWith: testKeyPrefix,
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.localizedString.deleteMany({
      where: {
        stringKey: {
          startsWith: testKeyPrefix,
        },
      },
    });
    await prisma.culture.deleteMany({
      where: {
        code: {
          in: [primaryCultureCode, secondaryCultureCode],
        },
      },
    });
    await prisma.$disconnect();
  });

  const ensureTestCultures = async (): Promise<void> => {
    await prisma.culture.upsert({
      where: { code: defaultCultureCode },
      create: { code: defaultCultureCode, name: "English (US)" },
      update: {},
    });

    await prisma.culture.upsert({
      where: { code: preferredCultureCode },
      create: { code: preferredCultureCode, name: "French" },
      update: {},
    });

    await prisma.culture.upsert({
      where: { code: primaryCultureCode },
      create: { code: primaryCultureCode, name: "Integration Culture 1" },
      update: {},
    });

    await prisma.culture.upsert({
      where: { code: secondaryCultureCode },
      create: { code: secondaryCultureCode, name: "Integration Culture 2" },
      update: {},
    });
  };

  it("returns 401 when auth header is missing", async () => {
    const response = await request(app).get("/localized-strings");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("AUTH_003: Authentication required");
  });

  it("returns 403 for POST when role is not allowed", async () => {
    const response = await request(app)
      .post("/localized-strings")
      .set(authHeader(TOKENS.FARMER))
      .send({
        cultureCode: primaryCultureCode,
        stringKey: `${testKeyPrefix}forbidden`,
        value: "Forbidden",
        context: "ADMIN",
      });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("AUTH_004: Insufficient permissions");
  });

  it("handles GET /localized-strings with real database and filters", async () => {
    await ensureTestCultures();
    const keyA = `${testKeyPrefix}a.${Date.now()}`;
    const keyB = `${testKeyPrefix}b.${Date.now()}`;

    await prisma.localizedString.createMany({
      data: [
        {
          cultureCode: primaryCultureCode,
          stringKey: keyA,
          value: "Hello",
          context: "API",
        },
        {
          cultureCode: secondaryCultureCode,
          stringKey: keyB,
          value: "Bonjour",
          context: "MOBILE",
        },
      ],
    });

    const response = await request(app)
      .get("/localized-strings")
      .query({ preferred_language: primaryCultureCode, context: "API" })
      .set(authHeader(TOKENS.MANAGER));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].stringKey).toBe(keyA);
    expect(response.body.data[0].cultureCode).toBe(primaryCultureCode);
  });

  it("resolves GET /localized-strings by preferred_language with default fallback", async () => {
    await ensureTestCultures();
    const keyWithTranslation = `${testKeyPrefix}pref.translated.${Date.now()}`;
    const keyFallbackOnly = `${testKeyPrefix}pref.fallback.${Date.now()}`;

    await prisma.localizedString.createMany({
      data: [
        {
          cultureCode: defaultCultureCode,
          stringKey: keyWithTranslation,
          value: "Mango",
          context: "API",
        },
        {
          cultureCode: preferredCultureCode,
          stringKey: keyWithTranslation,
          value: "Mangue",
          context: "API",
        },
        {
          cultureCode: defaultCultureCode,
          stringKey: keyFallbackOnly,
          value: "Avocado",
          context: "API",
        },
      ],
    });

    const response = await request(app)
      .get("/localized-strings")
      .query({
        preferred_language: preferredCultureCode,
        context: "API",
        string_keys: [keyWithTranslation, keyFallbackOnly],
      })
      .set(authHeader(TOKENS.MANAGER));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2);

    const translated = response.body.data.find(
      (item: { stringKey: string }) => item.stringKey === keyWithTranslation,
    );
    const fallback = response.body.data.find(
      (item: { stringKey: string }) => item.stringKey === keyFallbackOnly,
    );

    expect(translated?.cultureCode).toBe(preferredCultureCode);
    expect(translated?.value).toBe("Mangue");
    expect(fallback?.cultureCode).toBe(defaultCultureCode);
    expect(fallback?.value).toBe("Avocado");
  });

  it("handles POST /localized-strings with real database", async () => {
    await ensureTestCultures();
    const key = `${testKeyPrefix}create.${Date.now()}`;

    const response = await request(app)
      .post("/localized-strings")
      .set(authHeader(TOKENS.ADMIN))
      .send({
        cultureCode: primaryCultureCode,
        stringKey: key,
        value: "Login",
        context: "ADMIN",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.stringKey).toBe(key);
    expect(response.body.data.cultureCode).toBe(primaryCultureCode);
  });

  it("returns 400 for invalid POST payload", async () => {
    const response = await request(app)
      .post("/localized-strings")
      .set(authHeader(TOKENS.ADMIN))
      .send({
        cultureCode: primaryCultureCode,
        stringKey: `${testKeyPrefix}invalid.${Date.now()}`,
        context: "ADMIN",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("VAL_001: Validation failed");
    expect(response.body.errors.value).toBeDefined();
  });

  it("returns 400 for POST when culture does not exist", async () => {
    const response = await request(app)
      .post("/localized-strings")
      .set(authHeader(TOKENS.ADMIN))
      .send({
        cultureCode: "zz-ZZ",
        stringKey: `${testKeyPrefix}missing-culture.${Date.now()}`,
        value: "Login",
        context: "ADMIN",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("VAL_002: Invalid request body");
  });

  it("returns 409 for duplicate localized strings with current error mapping", async () => {
    await ensureTestCultures();
    const key = `${testKeyPrefix}duplicate.${Date.now()}`;

    await prisma.localizedString.create({
      data: {
        cultureCode: primaryCultureCode,
        stringKey: key,
        value: "Existing",
        context: "ADMIN",
      },
    });

    const response = await request(app)
      .post("/localized-strings")
      .set(authHeader(TOKENS.ADMIN))
      .send({
        cultureCode: primaryCultureCode,
        stringKey: key,
        value: "Duplicate",
        context: "ADMIN",
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("CON_001: Conflict detected");
  });

  it("handles PUT /localized-strings/:id", async () => {
    await ensureTestCultures();
    const created = await prisma.localizedString.create({
      data: {
        cultureCode: primaryCultureCode,
        stringKey: `${testKeyPrefix}update.${Date.now()}`,
        value: "Login",
        context: "ADMIN",
      },
    });

    const response = await request(app)
      .put(`/localized-strings/${created.id}`)
      .set(authHeader(TOKENS.ADMIN))
      .send({ value: "Sign in", cultureCode: secondaryCultureCode });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.value).toBe("Sign in");
    expect(response.body.data.cultureCode).toBe(secondaryCultureCode);
  });

  it("returns 400 for invalid PUT id", async () => {
    const response = await request(app)
      .put("/localized-strings/not-a-number")
      .set(authHeader(TOKENS.ADMIN))
      .send({ value: "Sign in" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("VAL_001: Validation failed");
  });

  it("returns 400 for PUT with empty payload", async () => {
    const response = await request(app)
      .put("/localized-strings/1")
      .set(authHeader(TOKENS.ADMIN))
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("VAL_001: Validation failed");
  });

  it("returns 404 for PUT when target does not exist", async () => {
    const response = await request(app)
      .put("/localized-strings/999999")
      .set(authHeader(TOKENS.ADMIN))
      .send({ value: "Sign in" });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("DATA_001: Resource not found");
  });

  it("returns 400 for PUT when new culture does not exist", async () => {
    await ensureTestCultures();
    const created = await prisma.localizedString.create({
      data: {
        cultureCode: primaryCultureCode,
        stringKey: `${testKeyPrefix}update-missing-culture.${Date.now()}`,
        value: "Login",
        context: "ADMIN",
      },
    });

    const response = await request(app)
      .put(`/localized-strings/${created.id}`)
      .set(authHeader(TOKENS.ADMIN))
      .send({ cultureCode: "zz-ZZ" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("VAL_002: Invalid request body");
  });

  it("handles DELETE /localized-strings/:id", async () => {
    await ensureTestCultures();
    const created = await prisma.localizedString.create({
      data: {
        cultureCode: primaryCultureCode,
        stringKey: `${testKeyPrefix}delete.${Date.now()}`,
        value: "Delete me",
        context: "ADMIN",
      },
    });

    const response = await request(app)
      .delete(`/localized-strings/${created.id}`)
      .set(authHeader(TOKENS.ADMIN));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Localized string deleted successfully");

    const inDb = await prisma.localizedString.findUnique({
      where: { id: created.id },
    });
    expect(inDb).toBeNull();
  });

  it("returns 404 for DELETE when target does not exist", async () => {
    const response = await request(app)
      .delete("/localized-strings/999999")
      .set(authHeader(TOKENS.ADMIN));

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("DATA_001: Resource not found");
  });

  it("returns 404 for unknown localization endpoint", async () => {
    const response = await request(app)
      .get("/localized-strings/unknown/path")
      .set(authHeader(TOKENS.MANAGER));

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("DATA_001: Resource not found");
  });
});
