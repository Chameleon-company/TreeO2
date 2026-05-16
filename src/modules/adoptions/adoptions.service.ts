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

const assertValidId = (id: number) => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, ERROR_CODES.VAL_002, ERROR_CODES.VAL_002);
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

const assertValidDate = (date: string) => {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError(400, "Invalid adoption date", ERROR_CODES.VAL_002);
  }

  if (parsedDate > new Date()) {
    throw new AppError(
      400,
      "Adoption date cannot be in the future",
      ERROR_CODES.VAL_003,
    );
  }

  return parsedDate;
};

const assertCreatePayload = (data: CreateAdoptionInput) => {
  assertValidId(Number(data.adopter_id));

  if (!data.fob_id?.trim()) {
    throw new AppError(400, ERROR_CODES.VAL_003, ERROR_CODES.VAL_003);
  }

  if (!data.adopted_at) {
    throw new AppError(400, ERROR_CODES.VAL_003, ERROR_CODES.VAL_003);
  }

  assertValidDate(data.adopted_at);
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
    assertValidDate(data.adopted_at);
  }
};

export class AdoptionsService {
  async listAdoptions(page = 1, limit = 10) {
    assertValidPagination(page, limit);

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.adoption.findMany({
        skip,
        take: limit,
        orderBy: { id: "desc" },
      }),
      prisma.adoption.count(),
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
        adoptedAt: assertValidDate(data.adopted_at),
      },
    });
  }

  async getAdoptionById(id: number) {
    assertValidId(id);

    const adoption = await prisma.adoption.findUnique({
      where: { id },
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
          ? { adoptedAt: assertValidDate(data.adopted_at) }
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

export type { CreateAdoptionInput, UpdateAdoptionInput };
