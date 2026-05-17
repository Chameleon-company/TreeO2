import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { ERROR_CODES } from "../../utils/errorCodes";

interface CreateAdoptionInput {
  adopter_id: number;
  fob_id: string;
  adopted_at: string;
}

interface UpdateAdoptionInput {
  adopter_id?: number;
  fob_id?: string;
  adopted_at?: string;
}

interface ListAdoptionsFilters {
  page?: number;
  limit?: number;
  fob_id?: string;
  adopter_id?: number;
  adopter?: string;
  year?: number;
}

const assertValidId = (id: number) => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, "Invalid ID", ERROR_CODES.VAL_002);
  }
};

const assertValidPagination = (page: number, limit: number) => {
  if (
    !Number.isInteger(page) ||
    !Number.isInteger(limit) ||
    page <= 0 ||
    limit <= 0
  ) {
    throw new AppError(
      400,
      "Invalid pagination parameters",
      ERROR_CODES.VAL_002,
    );
  }
};

const assertValidYear = (year: number) => {
  const currentYear = new Date().getFullYear();

  if (!Number.isInteger(year) || year < 1900 || year > currentYear) {
    throw new AppError(400, "Invalid year filter", ERROR_CODES.VAL_002);
  }
};

const parseStrictDate = (date: string) => {
  if (typeof date !== "string" || !date.trim()) {
    throw new AppError(400, "adopted_at is required", ERROR_CODES.VAL_003);
  }

  const trimmedDate = date.trim();
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateRegex.test(trimmedDate)) {
    throw new AppError(
      400,
      "Adoption date must use YYYY-MM-DD format",
      ERROR_CODES.VAL_002,
    );
  }

  const parsedDate = new Date(`${trimmedDate}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError(400, "Invalid adoption date", ERROR_CODES.VAL_002);
  }

  const [year, month, day] = trimmedDate.split("-").map(Number);

  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() + 1 !== month ||
    parsedDate.getUTCDate() !== day
  ) {
    throw new AppError(400, "Invalid adoption date", ERROR_CODES.VAL_002);
  }

  const today = new Date();
  today.setUTCHours(23, 59, 59, 999);

  if (parsedDate > today) {
    throw new AppError(
      400,
      "Adoption date cannot be in the future",
      ERROR_CODES.VAL_002,
    );
  }

  return parsedDate;
};

const assertCreatePayload = (data: CreateAdoptionInput) => {
  if (data.adopter_id === undefined || data.adopter_id === null) {
    throw new AppError(400, "adopter_id is required", ERROR_CODES.VAL_003);
  }

  assertValidId(Number(data.adopter_id));

  if (!data.fob_id?.trim()) {
    throw new AppError(400, "fob_id is required", ERROR_CODES.VAL_003);
  }

  parseStrictDate(data.adopted_at);
};

const assertUpdatePayload = (data: UpdateAdoptionInput) => {
  if (Object.keys(data).length === 0) {
    throw new AppError(
      400,
      "No fields provided for update",
      ERROR_CODES.VAL_003,
    );
  }

  if (data.adopter_id !== undefined) {
    assertValidId(Number(data.adopter_id));
  }

  if (data.fob_id !== undefined && !data.fob_id.trim()) {
    throw new AppError(400, "Invalid fob_id", ERROR_CODES.VAL_002);
  }

  if (data.adopted_at !== undefined) {
    parseStrictDate(data.adopted_at);
  }
};

export class AdoptionsService {
  async listAdoptions(filters: ListAdoptionsFilters = {}) {
    const page = filters.page === undefined ? 1 : Number(filters.page);

    const limit = filters.limit === undefined ? 10 : Number(filters.limit);

    assertValidPagination(page, limit);

    const skip = (page - 1) * limit;

    const where: Prisma.AdoptionWhereInput = {};

    if (filters.fob_id !== undefined) {
      if (!filters.fob_id.trim()) {
        throw new AppError(400, "Invalid fob_id filter", ERROR_CODES.VAL_002);
      }

      where.fobId = {
        contains: filters.fob_id.trim(),
        mode: "insensitive",
      };
    }

    if (filters.adopter_id !== undefined) {
      assertValidId(Number(filters.adopter_id));

      where.adopterId = Number(filters.adopter_id);
    }

    if (filters.adopter !== undefined) {
      if (!filters.adopter.trim()) {
        throw new AppError(400, "Invalid adopter filter", ERROR_CODES.VAL_002);
      }

      where.adopter = {
        name: {
          contains: filters.adopter.trim(),
          mode: "insensitive",
        },
      };
    }

    if (filters.year !== undefined) {
      const year = Number(filters.year);

      assertValidYear(year);

      where.adoptedAt = {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lte: new Date(`${year}-12-31T23:59:59.999Z`),
      };
    }

    const [data, total] = await Promise.all([
      prisma.adoption.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: "desc" },
        include: {
          adopter: true,
        },
      }),

      prisma.adoption.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async createAdoption(data: CreateAdoptionInput) {
    assertCreatePayload(data);

    const adopter = await prisma.adopter.findUnique({
      where: { id: Number(data.adopter_id) },
    });

    if (!adopter) {
      throw new AppError(404, "Adopter not found", ERROR_CODES.DATA_001);
    }

    return prisma.adoption.create({
      data: {
        adopterId: Number(data.adopter_id),
        fobId: data.fob_id.trim(),
        adoptedAt: parseStrictDate(data.adopted_at),
      },
    });
  }

  async getAdoptionById(id: number) {
    assertValidId(id);

    const adoption = await prisma.adoption.findUnique({
      where: { id },
      include: {
        adopter: true,
      },
    });

    if (!adoption) {
      throw new AppError(404, "Adoption not found", ERROR_CODES.DATA_001);
    }

    return adoption;
  }

  async updateAdoption(id: number, data: UpdateAdoptionInput) {
    assertValidId(id);

    assertUpdatePayload(data);

    await this.getAdoptionById(id);

    if (data.adopter_id !== undefined) {
      const adopter = await prisma.adopter.findUnique({
        where: { id: Number(data.adopter_id) },
      });

      if (!adopter) {
        throw new AppError(404, "Adopter not found", ERROR_CODES.DATA_001);
      }
    }

    return prisma.adoption.update({
      where: { id },

      data: {
        ...(data.adopter_id !== undefined
          ? { adopterId: Number(data.adopter_id) }
          : {}),

        ...(data.fob_id !== undefined ? { fobId: data.fob_id.trim() } : {}),

        ...(data.adopted_at !== undefined
          ? { adoptedAt: parseStrictDate(data.adopted_at) }
          : {}),
      },
    });
  }

  async deleteAdoption(id: number) {
    assertValidId(id);

    await this.getAdoptionById(id);

    await prisma.adoption.delete({
      where: { id },
    });

    return {
      message: "Adoption deleted successfully",
    };
  }
}

export const adoptionsService = new AdoptionsService();

export type { CreateAdoptionInput, UpdateAdoptionInput, ListAdoptionsFilters };
