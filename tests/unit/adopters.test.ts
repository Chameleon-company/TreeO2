import { describe, expect, jest, beforeEach, it } from "@jest/globals";
import * as adopterService from "../../src/modules/adopters/adopters.service";
import { PrismaClient } from "@prisma/client";

/**
 * Mock Prisma
 */
jest.mock("@prisma/client", () => {
  const mockPrisma = {
    adopter: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

const prisma = new PrismaClient() as any;

describe("Adopter Service", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listAdopters", () => {
    it("should return paginated adopters", async () => {
      prisma.adopter.findMany.mockResolvedValue([
        {
          id: 1,
          name: "Hashini",
          email: "hashini@gmail.com",
        },
      ]);

      prisma.adopter.count.mockResolvedValue(1);

      const result = await adopterService.listAdopters(1, 10);

      expect(result.data.length).toBe(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe("createAdopter", () => {
    it("should create adopter", async () => {
      prisma.adopter.create.mockResolvedValue({
        id: 1,
        name: "Hashini",
        email: "hashini@gmail.com",
      });

      const result = await adopterService.createAdopter({
        name: "Hashini",
        email: "hashini@gmail.com",
      });

      expect(result.name).toBe("Hashini");
    });

    it("should throw error when name missing", async () => {
      await expect(
        adopterService.createAdopter({} as any)
      ).rejects.toThrow("Name is required");
    });
  });

  describe("getAdopterById", () => {
    it("should return adopter", async () => {
      prisma.adopter.findUnique.mockResolvedValue({
        id: 1,
        name: "Hashini",
      });

      const result = await adopterService.getAdopterById(1);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
    });
  });

  describe("deleteAdopter", () => {
    it("should delete adopter", async () => {
      prisma.adopter.findUnique.mockResolvedValue({
        id: 1,
        adoptions: [],
      });

      prisma.adopter.delete.mockResolvedValue({
        id: 1,
      });

      await adopterService.deleteAdopter(1);

      expect(prisma.adopter.delete).toHaveBeenCalled();
    });
  });

});