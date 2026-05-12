import { describe, expect, jest, beforeEach, it } from "@jest/globals";
import { adoptersService } from "../../src/modules/adopters/adopters.service";
import { AppError } from "../../src/middleware/errorHandler";
import { prisma } from "../../src/lib/prisma";

/**
 * Mock prisma
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

describe("Adopters Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listAdopters", () => {
    it("should return paginated adopters", async () => {
      (prisma.adopter.findMany as jest.Mock).mockImplementation(async () => [
        {
          id: 1,
          name: "Hashini",
          email: "hashini@gmail.com",
        },
      ]);

      (prisma.adopter.count as jest.Mock).mockImplementation(
        async () => 1,
      );

      const result = await adoptersService.listAdopters(1, 10);

      expect(result.length).toBe(1);
      expect(result[0]?.id).toBe(1);
    });
  });

  describe("createAdopter", () => {
    it("should create adopter", async () => {
      (prisma.adopter.create as jest.Mock).mockImplementation(async () => ({
        id: 1,
        name: "Hashini",
        email: "hashini@gmail.com",
      }));

      const result = await adoptersService.createAdopter({
        name: "Hashini",
        email: "hashini@gmail.com",
      });

      expect(result.name).toBe("Hashini");
      expect(result.email).toBe("hashini@gmail.com");
    });

    it("should throw validation error when name missing", async () => {
      await expect(
        adoptersService.createAdopter({
          name: "",
          email: "hashini@gmail.com",
        }),
      ).rejects.toThrow(AppError);
    });
  });

  describe("getAdopterById", () => {
    it("should return adopter", async () => {
      (prisma.adopter.findUnique as jest.Mock).mockImplementation(
        async () => ({
          id: 1,
          name: "Hashini",
          email: "hashini@gmail.com",
        }),
      );

      const result = await adoptersService.getAdopterById(1);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
    });

    it("should throw error when adopter not found", async () => {
      (prisma.adopter.findUnique as jest.Mock).mockImplementation(
        async () => null,
      );

      await expect(adoptersService.getAdopterById(999)).rejects.toThrow(
        AppError,
      );
    });
  });

  describe("updateAdopter", () => {
    it("should update adopter", async () => {
      (prisma.adopter.findUnique as jest.Mock).mockImplementation(
        async () => ({
          id: 1,
          name: "Old Name",
          email: "old@gmail.com",
        }),
      );

      (prisma.adopter.update as jest.Mock).mockImplementation(async () => ({
        id: 1,
        name: "Updated Name",
        email: "updated@gmail.com",
      }));

      const result = await adoptersService.updateAdopter(1, {
        name: "Updated Name",
        email: "updated@gmail.com",
      });

      expect(result.name).toBe("Updated Name");
      expect(result.email).toBe("updated@gmail.com");
    });
  });

  describe("deleteAdopter", () => {
    it("should delete adopter", async () => {
      (prisma.adopter.findUnique as jest.Mock).mockImplementation(
        async () => ({
          id: 1,
          name: "Hashini",
        }),
      );

      (prisma.adopter.delete as jest.Mock).mockImplementation(async () => ({
        id: 1,
      }));

      const result = await adoptersService.deleteAdopter(1);

      expect(prisma.adopter.delete).toHaveBeenCalled();

      expect(result).toEqual({
        message: "Adopter deleted successfully",
      });
    });
  });
});