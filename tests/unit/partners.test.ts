import { ERROR_CODES } from "../../src/utils/errorCodes";
import { PartnersService } from "../../src/modules/partners/partners.service";

jest.mock("@prisma/client", () => {
  const mockPrisma = {
    partner: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  class PrismaClientKnownRequestError extends Error {
    code: string;

    constructor(message: string, options: { code: string }) {
      super(message);
      this.code = options.code;
      this.name = "PrismaClientKnownRequestError";
    }
  }

  return {
    PrismaClient: jest.fn(() => mockPrisma),
    Prisma: {
      PrismaClientKnownRequestError,
    },
    __mockPrisma: mockPrisma,
  };
});

const { __mockPrisma: mockPrisma } = jest.requireMock("@prisma/client");

// Unit tests for PartnersService business logic.
describe("PartnersService", () => {
  let service: PartnersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PartnersService();
  });

  // Tests for retrieving all partners.
  describe("getAllPartners", () => {
    it("should return all partners ordered by newest first", async () => {
      const partners = [
        { id: 2, name: "Partner B", createdAt: new Date() },
        { id: 1, name: "Partner A", createdAt: new Date() },
      ];

      mockPrisma.partner.findMany.mockResolvedValue(partners);

      const result = await service.getAllPartners();

      expect(mockPrisma.partner.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(partners);
    });

    it("should throw SYS_002 when fetching partners fails", async () => {
      mockPrisma.partner.findMany.mockRejectedValue(new Error("DB failure"));

      await expect(service.getAllPartners()).rejects.toMatchObject({
        statusCode: 500,
        code: ERROR_CODES.SYS_002,
      });
    });
  });

  // Tests for retrieving a single partner by id.
  describe("getPartnerById", () => {
    it("should return a partner when valid id exists", async () => {
      const partner = {
        id: 1,
        name: "TreeO2-Xpand Foundation",
        createdAt: new Date(),
      };

      mockPrisma.partner.findUnique.mockResolvedValue(partner);

      const result = await service.getPartnerById(1);

      expect(mockPrisma.partner.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(partner);
    });

    it("should throw VAL_002 when partner id is invalid", async () => {
      await expect(service.getPartnerById(0)).rejects.toMatchObject({
        statusCode: 400,
        code: ERROR_CODES.VAL_002,
      });
    });

    it("should throw DATA_001 when partner is not found", async () => {
      mockPrisma.partner.findUnique.mockResolvedValue(null);

      await expect(service.getPartnerById(1)).rejects.toMatchObject({
        statusCode: 404,
        code: ERROR_CODES.DATA_001,
        message: "Partner not found",
      });
    });
  });

  // Tests for creating a new partner.
  describe("createPartner", () => {
    it("should create a partner successfully with valid input", async () => {
      const createdPartner = {
        id: 1,
        name: "TreeO2-Xpand Foundation",
        createdAt: new Date(),
      };

      mockPrisma.partner.create.mockResolvedValue(createdPartner);

      const result = await service.createPartner({
        name: "TreeO2-Xpand Foundation",
      });

      expect(mockPrisma.partner.create).toHaveBeenCalledWith({
        data: { name: "TreeO2-Xpand Foundation" },
      });
      expect(result).toEqual(createdPartner);
    });

    it("should trim the name before saving", async () => {
      const createdPartner = {
        id: 1,
        name: "TreeO2-Xpand Foundation",
        createdAt: new Date(),
      };

      mockPrisma.partner.create.mockResolvedValue(createdPartner);

      await service.createPartner({ name: "  TreeO2-Xpand Foundation  " });

      expect(mockPrisma.partner.create).toHaveBeenCalledWith({
        data: { name: "TreeO2-Xpand Foundation" },
      });
    });

    it("should throw VAL_003 when name is empty", async () => {
      await expect(service.createPartner({ name: "" })).rejects.toMatchObject({
        statusCode: 400,
        code: ERROR_CODES.VAL_003,
      });
    });

    it("should throw DATA_002 when duplicate name error occurs", async () => {
      const { Prisma } = jest.requireMock("@prisma/client");

      mockPrisma.partner.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("Duplicate", {
          code: "P2002",
        }),
      );

      await expect(
        service.createPartner({ name: "TreeO2-Xpand Foundation" }),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: ERROR_CODES.DATA_002,
      });
    });
  });

  // Tests for updating an existing partner.
  describe("updatePartner", () => {
    it("should update a partner successfully with valid input", async () => {
      const existingPartner = {
        id: 1,
        name: "TreeO2-Xpand Foundation",
        createdAt: new Date(),
      };

      const updatedPartner = {
        ...existingPartner,
        name: "Updated Partner Name",
      };

      mockPrisma.partner.findUnique.mockResolvedValue(existingPartner);
      mockPrisma.partner.update.mockResolvedValue(updatedPartner);

      const result = await service.updatePartner(1, {
        name: "Updated Partner Name",
      });

      expect(mockPrisma.partner.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: "Updated Partner Name" },
      });
      expect(result).toEqual(updatedPartner);
    });

    it("should throw VAL_003 when update payload is empty", async () => {
      await expect(service.updatePartner(1, {})).rejects.toMatchObject({
        statusCode: 400,
        code: ERROR_CODES.VAL_003,
      });
    });

    it("should throw VAL_002 when partner id is invalid", async () => {
      await expect(
        service.updatePartner(0, { name: "Test" }),
      ).rejects.toMatchObject({
        statusCode: 400,
        code: ERROR_CODES.VAL_002,
      });
    });

    it("should throw DATA_001 when partner is not found", async () => {
      mockPrisma.partner.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePartner(1, { name: "Updated Name" }),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: ERROR_CODES.DATA_001,
        message: "Partner not found",
      });
    });
  });

  // Tests for deleting a partner.
  describe("deletePartner", () => {
    it("should delete a partner successfully", async () => {
      const existingPartner = {
        id: 1,
        name: "TreeO2-Xpand Foundation",
        createdAt: new Date(),
      };

      mockPrisma.partner.findUnique.mockResolvedValue(existingPartner);
      mockPrisma.partner.delete.mockResolvedValue(existingPartner);

      const result = await service.deletePartner(1);

      expect(mockPrisma.partner.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual({ message: "Partner deleted successfully" });
    });

    it("should throw VAL_002 when partner id is invalid", async () => {
      await expect(service.deletePartner(0)).rejects.toMatchObject({
        statusCode: 400,
        code: ERROR_CODES.VAL_002,
      });
    });

    it("should throw DATA_001 when partner is not found", async () => {
      mockPrisma.partner.findUnique.mockResolvedValue(null);

      await expect(service.deletePartner(1)).rejects.toMatchObject({
        statusCode: 404,
        code: ERROR_CODES.DATA_001,
        message: "Partner not found",
      });
    });
  });
});
