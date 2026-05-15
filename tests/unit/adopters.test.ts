import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { adoptersService } from "../../src/modules/adopters/adopters.service";
import { prisma } from "../../src/lib/prisma";
import { AppError } from "../../src/middleware/errorHandler";

/**
 * =========================
 * MOCK PRISMA
 * =========================
 */
jest.mock("../../src/lib/prisma", () => ({
  prisma: {
    adopter: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const mockedPrismaAdopter = prisma.adopter as {
  create: jest.MockedFunction<any>;
  findMany: jest.MockedFunction<any>;
  findUnique: jest.MockedFunction<any>;
  update: jest.MockedFunction<any>;
  delete: jest.MockedFunction<any>;
  count: jest.MockedFunction<any>;
};

describe("AdoptersService - Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * =========================
   * CREATE
   * =========================
   */
  describe("createAdopter", () => {
    it("should create adopter successfully", async () => {
      mockedPrismaAdopter.create.mockResolvedValue({
        id: 1,
        name: "Hashini",
        email: "hashini@gmail.com",
      });

      const result = await adoptersService.createAdopter({
        name: "Hashini",
        email: "hashini@gmail.com",
      });

      expect(result.id).toBe(1);
      expect(result.name).toBe("Hashini");
      expect(mockedPrismaAdopter.create).toHaveBeenCalledTimes(1);
    });

    it("should throw 400 when name is empty", async () => {
    await expect(
        adoptersService.createAdopter({
          name: "",
          email: "test@gmail.com",
        }),
      ).rejects.toThrow(AppError);
    });

    it("should give 400 when email is empty", async () => {
      await expect(
        adoptersService.createAdopter({
          name: "Test",
          email: "",
        }),
      ).rejects.toThrow(AppError);

      
    });
    
  });

  /**
   * =========================
   * LIST
   * =========================
   */
  describe("listAdopters", () => {
    it("should return paginated adopters", async () => {
      mockedPrismaAdopter.findMany.mockResolvedValue([
        { id: 1, name: "A", email: "a@mail.com" },
      ]);

      mockedPrismaAdopter.count.mockResolvedValue(1);

      const result = await adoptersService.listAdopters(1, 10);

      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
      expect(mockedPrismaAdopter.findMany).toHaveBeenCalled();
    });
  });

  /**
   * =========================
   * GET BY ID
   * =========================
   */
  describe("getAdopterById", () => {
    it("should return adopter when exists", async () => {
      mockedPrismaAdopter.findUnique.mockResolvedValue({
        id: 1,
        name: "Hashini",
        email: "hashini@gmail.com",
      });

      const result = await adoptersService.getAdopterById(1);

      expect(result.id).toBe(1);
    });

    it("should throw 404 when adopter not found", async () => {
      mockedPrismaAdopter.findUnique.mockResolvedValue(null);

      await expect(
        adoptersService.getAdopterById(999),
      ).rejects.toThrow(AppError);
    });
  });

  /**
   * =========================
   * UPDATE
   * =========================
   */
  describe("updateAdopter", () => {
    it("should update adopter successfully", async () => {
      mockedPrismaAdopter.findUnique.mockResolvedValue({
        id: 1,
        name: "Old",
        email: "old@mail.com",
      });

      mockedPrismaAdopter.update.mockResolvedValue({
        id: 1,
        name: "Updated",
        email: "updated@mail.com",
      });

      const result = await adoptersService.updateAdopter(1, {
        name: "Updated",
        email: "updated@mail.com",
      });

      expect(result.name).toBe("Updated");
      expect(mockedPrismaAdopter.update).toHaveBeenCalledTimes(1);
    });

    it("should throw 404 when updating non-existing adopter", async () => {
      mockedPrismaAdopter.findUnique.mockResolvedValue(null);

      await expect(
        adoptersService.updateAdopter(999, {
          name: "Test",
        }),
      ).rejects.toThrow(AppError);
    });

    it("should throw 400 when name is empty string", async () => {
      mockedPrismaAdopter.findUnique.mockResolvedValue({
        id: 1,
        name: "Old",
        email: "old@mail.com",
      });

      await expect(
        adoptersService.updateAdopter(1, {
          name: "",
        }),
      ).rejects.toThrow(AppError);
    });
  });

  /**
   * =========================
   * DELETE
   * =========================
   */
  describe("deleteAdopter", () => {
    it("should delete adopter successfully", async () => {
      mockedPrismaAdopter.findUnique.mockResolvedValue({
        id: 1,
      });

      mockedPrismaAdopter.delete.mockResolvedValue({
        id: 1,
      });

      const result = await adoptersService.deleteAdopter(1);

      expect(result.message).toBe("Adopter deleted successfully");
      expect(mockedPrismaAdopter.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should throw 404 when deleting non-existing adopter", async () => {
      mockedPrismaAdopter.findUnique.mockResolvedValue(null);

      await expect(
        adoptersService.deleteAdopter(999),
      ).rejects.toThrow(AppError);
    });
  });
});