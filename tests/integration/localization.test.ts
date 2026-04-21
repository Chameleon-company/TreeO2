import {
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

jest.mock("../../src/config/env", () => ({
  env: {
    NODE_ENV: "development",
    LOG_TO_FILE: false,
    PORT: 3000,
    RATE_LIMIT_WINDOW_MS: 900000,
    RATE_LIMIT_MAX: 100,
    JWT_SECRET: "12345678901234567890123456789012",
    JWT_EXPIRES_IN: "24h",
    DATABASE_URL: "postgresql://user:pass@localhost:5432/treeo2",
    DB_HOST: "localhost",
    DB_PORT: 5432,
    DB_NAME: "treeo2",
    DB_USER: "treeo2_user",
    DB_PASSWORD: "treeo2_password",
  },
}));

import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";
import { errorHandler, notFound } from "../../src/middleware/errorHandler";
import localizationRoutes from "../../src/modules/localization/localization.routes";
import { LocalizationController } from "../../src/modules/localization/localization.controller";

jest.mock("../../src/lib/prisma", () => ({
  prisma: {
    localizedString: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock("../../src/middleware/auth.middleware", () => ({
  authMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

jest.mock("../../src/middleware/role.middleware", () => ({
  roleMiddleware:
    () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

describe("Localization API", () => {
  const app = express();

  beforeAll(() => {
    app.use(express.json());
    app.use("/localized-strings", localizationRoutes);
    app.use(notFound);
    app.use(errorHandler);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("handles GET /localized-strings", async () => {
    const listSpy = jest
      .spyOn(LocalizationController.prototype, "listLocalizedStrings")
      .mockImplementationOnce(async (_req: Request, res: Response) => {
        res.status(200).json({
          success: true,
          data: [
            {
              id: 1,
              cultureCode: "en-US",
              stringKey: "home.title",
              value: "Welcome",
              context: "API",
            },
          ],
        });
      });

    const response = await request(app).get("/localized-strings");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(listSpy).toHaveBeenCalledTimes(1);
  });

  it("handles POST /localized-strings", async () => {
    const createSpy = jest
      .spyOn(LocalizationController.prototype, "createLocalizedString")
      .mockImplementationOnce(async (_req: Request, res: Response) => {
        res.status(201).json({
          success: true,
          data: {
            id: 2,
            cultureCode: "en-US",
            stringKey: "auth.login",
            value: "Login",
            context: "ADMIN",
          },
        });
      });

    const response = await request(app).post("/localized-strings").send({
      cultureCode: "en-US",
      stringKey: "auth.login",
      value: "Login",
      context: "ADMIN",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.stringKey).toBe("auth.login");
    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  it("handles PUT /localized-strings/:id", async () => {
    const updateSpy = jest
      .spyOn(LocalizationController.prototype, "updateLocalizedString")
      .mockImplementationOnce(async (_req: Request, res: Response) => {
        res.status(200).json({
          success: true,
          data: {
            id: 2,
            cultureCode: "en-US",
            stringKey: "auth.login",
            value: "Sign in",
            context: "ADMIN",
          },
        });
      });

    const response = await request(app)
      .put("/localized-strings/2")
      .send({ value: "Sign in" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.value).toBe("Sign in");
    expect(updateSpy).toHaveBeenCalledTimes(1);
  });

  it("handles DELETE /localized-strings/:id", async () => {
    const deleteSpy = jest
      .spyOn(LocalizationController.prototype, "deleteLocalizedString")
      .mockImplementationOnce(async (_req: Request, res: Response) => {
        res.status(200).json({
          success: true,
          message: "Localized string deleted successfully",
        });
      });

    const response = await request(app).delete("/localized-strings/2");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(deleteSpy).toHaveBeenCalledTimes(1);
  });

  it("returns 404 for unknown localization endpoint", async () => {
    const response = await request(app).get("/localized-strings/unknown/path");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("DATA_001: Resource not found");
  });
});
