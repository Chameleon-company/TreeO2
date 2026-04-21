import {
  beforeEach,
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

import { AppError } from "../../src/middleware/errorHandler";
import { LocalizationService } from "../../src/modules/localization/localization.service";
import { ERROR_CODES } from "../../src/utils/errorCodes";
import { prisma } from "../../src/lib/prisma";

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

type MockedLocalizedStringModel = {
  findMany: ReturnType<typeof jest.fn>;
  create: ReturnType<typeof jest.fn>;
  findUnique: ReturnType<typeof jest.fn>;
  update: ReturnType<typeof jest.fn>;
  delete: ReturnType<typeof jest.fn>;
};

const localizedStringModel =
  prisma.localizedString as unknown as MockedLocalizedStringModel;

describe("LocalizationService", () => {
  const service = new LocalizationService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds filters and sort order for listLocalizedStrings", async () => {
    localizedStringModel.findMany.mockResolvedValueOnce([]);

    await service.listLocalizedStrings({
      cultureCode: "en-US",
      context: "API",
    });

    expect(localizedStringModel.findMany).toHaveBeenCalledWith({
      where: {
        cultureCode: "en-US",
        context: "API",
      },
      orderBy: [
        { cultureCode: "asc" },
        { context: "asc" },
        { stringKey: "asc" },
      ],
    });
  });

  it("creates a localized string", async () => {
    const payload = {
      cultureCode: "en-US",
      stringKey: "home.title",
      value: "Welcome",
      context: "API",
    };

    localizedStringModel.create.mockResolvedValueOnce({ id: 1, ...payload });

    await service.createLocalizedString(payload);

    expect(localizedStringModel.create).toHaveBeenCalledWith({ data: payload });
  });

  it("updates an existing localized string", async () => {
    localizedStringModel.findUnique.mockResolvedValueOnce({
      id: 10,
      cultureCode: "en-US",
      stringKey: "home.title",
      value: "Welcome",
      context: "API",
    });
    localizedStringModel.update.mockResolvedValueOnce({
      id: 10,
      cultureCode: "en-US",
      stringKey: "home.title",
      value: "Hello",
      context: "API",
    });

    await service.updateLocalizedString(10, { value: "Hello" });

    expect(localizedStringModel.findUnique).toHaveBeenCalledWith({
      where: { id: 10 },
    });
    expect(localizedStringModel.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { value: "Hello" },
    });
  });

  it("throws DATA_001 when update target does not exist", async () => {
    localizedStringModel.findUnique.mockResolvedValueOnce(null);

    await expect(service.updateLocalizedString(99, { value: "Hello" })).rejects
      .toEqual(new AppError(404, ERROR_CODES.DATA_001, "DATA_001"));

    expect(localizedStringModel.update).not.toHaveBeenCalled();
  });

  it("deletes an existing localized string", async () => {
    localizedStringModel.findUnique.mockResolvedValueOnce({
      id: 11,
      cultureCode: "en-US",
      stringKey: "home.subtitle",
      value: "Sub",
      context: "API",
    });
    localizedStringModel.delete.mockResolvedValueOnce({ id: 11 });

    await service.deleteLocalizedString(11);

    expect(localizedStringModel.findUnique).toHaveBeenCalledWith({
      where: { id: 11 },
    });
    expect(localizedStringModel.delete).toHaveBeenCalledWith({
      where: { id: 11 },
    });
  });

  it("throws DATA_001 when delete target does not exist", async () => {
    localizedStringModel.findUnique.mockResolvedValueOnce(null);

    await expect(service.deleteLocalizedString(101)).rejects.toEqual(
      new AppError(404, ERROR_CODES.DATA_001, "DATA_001"),
    );

    expect(localizedStringModel.delete).not.toHaveBeenCalled();
  });
});
