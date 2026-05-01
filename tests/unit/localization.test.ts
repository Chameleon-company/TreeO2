import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import { AppError } from "../../src/middleware/errorHandler";
import { LocalizationService } from "../../src/modules/localization/localization.service";
import { ERROR_CODES } from "../../src/utils/errorCodes";
import { prisma } from "../../src/lib/prisma";

jest.mock("../../src/lib/prisma", () => ({
  prisma: {
    culture: {
      findUnique: jest.fn(),
    },
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

type MockedCultureModel = {
  findUnique: ReturnType<typeof jest.fn>;
};

const localizedStringModel =
  prisma.localizedString as unknown as MockedLocalizedStringModel;
const cultureModel = prisma.culture as unknown as MockedCultureModel;

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
        { context: "asc" },
        { stringKey: "asc" },
      ],
    });
  });

  it("uses empty where clause when listLocalizedStrings has no filters", async () => {
    localizedStringModel.findMany.mockResolvedValueOnce([]);

    await service.listLocalizedStrings({});

    expect(localizedStringModel.findMany).toHaveBeenCalledWith({
      where: {
        cultureCode: "en-US",
      },
      orderBy: [
        { context: "asc" },
        { stringKey: "asc" },
      ],
    });
  });

  it("resolves localized strings by preferredLanguage with fallback", async () => {
    localizedStringModel.findMany.mockResolvedValueOnce([
      {
        id: 1,
        cultureCode: "en-US",
        stringKey: "tree.oak",
        value: "Oak",
        context: "API",
      },
      {
        id: 2,
        cultureCode: "fr-FR",
        stringKey: "tree.oak",
        value: "Chene",
        context: "API",
      },
      {
        id: 3,
        cultureCode: "en-US",
        stringKey: "tree.pine",
        value: "Pine",
        context: "API",
      },
    ]);

    const results = await service.listLocalizedStrings({
      preferredLanguage: "fr-FR",
      context: "API",
    });

    expect(localizedStringModel.findMany).toHaveBeenCalledWith({
      where: {
        context: "API",
        cultureCode: {
          in: ["fr-FR", "en-US"],
        },
      },
      orderBy: [{ stringKey: "asc" }, { cultureCode: "asc" }],
    });

    expect(results).toHaveLength(2);
    expect(results.find((item) => item.stringKey === "tree.oak")?.cultureCode).toBe(
      "fr-FR",
    );
    expect(results.find((item) => item.stringKey === "tree.pine")?.cultureCode).toBe(
      "en-US",
    );
  });

  it("creates a localized string", async () => {
    const payload = {
      cultureCode: "en-US",
      stringKey: "home.title",
      value: "Welcome",
      context: "API",
    };

    cultureModel.findUnique.mockResolvedValueOnce({ code: "en-US" });
    localizedStringModel.create.mockResolvedValueOnce({ id: 1, ...payload });

    await service.createLocalizedString(payload);

    expect(cultureModel.findUnique).toHaveBeenCalledWith({
      where: { code: "en-US" },
      select: { code: true },
    });
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

  it("validates culture when updating cultureCode", async () => {
    localizedStringModel.findUnique.mockResolvedValueOnce({
      id: 12,
      cultureCode: "en-US",
      stringKey: "home.title",
      value: "Welcome",
      context: "API",
    });
    cultureModel.findUnique.mockResolvedValueOnce({ code: "fr-FR" });
    localizedStringModel.update.mockResolvedValueOnce({
      id: 12,
      cultureCode: "fr-FR",
      stringKey: "home.title",
      value: "Bienvenue",
      context: "API",
    });

    await service.updateLocalizedString(12, {
      cultureCode: "fr-FR",
      value: "Bienvenue",
    });

    expect(cultureModel.findUnique).toHaveBeenCalledWith({
      where: { code: "fr-FR" },
      select: { code: true },
    });
    expect(localizedStringModel.update).toHaveBeenCalledWith({
      where: { id: 12 },
      data: { cultureCode: "fr-FR", value: "Bienvenue" },
    });
  });

  it("throws VAL_002 when update culture does not exist", async () => {
    localizedStringModel.findUnique.mockResolvedValueOnce({
      id: 13,
      cultureCode: "en-US",
      stringKey: "home.title",
      value: "Welcome",
      context: "API",
    });
    cultureModel.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.updateLocalizedString(13, { cultureCode: "zz-ZZ" }),
    ).rejects.toEqual(new AppError(400, ERROR_CODES.VAL_002, "VAL_002"));

    expect(localizedStringModel.update).not.toHaveBeenCalled();
  });

  it("throws DATA_001 when update target does not exist", async () => {
    localizedStringModel.findUnique.mockResolvedValueOnce(null);

    await expect(service.updateLocalizedString(99, { value: "Hello" })).rejects
      .toEqual(new AppError(404, ERROR_CODES.DATA_001, "DATA_001"));

    expect(localizedStringModel.update).not.toHaveBeenCalled();
  });

  it("throws VAL_002 when create culture does not exist", async () => {
    const payload = {
      cultureCode: "zz-ZZ",
      stringKey: "home.title",
      value: "Welcome",
      context: "API",
    };

    cultureModel.findUnique.mockResolvedValueOnce(null);

    await expect(service.createLocalizedString(payload)).rejects.toEqual(
      new AppError(400, ERROR_CODES.VAL_002, "VAL_002"),
    );

    expect(localizedStringModel.create).not.toHaveBeenCalled();
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
