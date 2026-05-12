import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { ERROR_CODES } from "../../utils/errorCodes";

interface CreateAdopterInput {
  name: string;
  email?: string;
}

interface UpdateAdopterInput {
  name?: string;
  email?: string;
}

// -----------------------------
// Validation Helpers
// -----------------------------

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

const assertValidEmail = (email?: string) => {
  if (email !== undefined) {
    if (typeof email !== "string") {
      throw new AppError(400, "Invalid email", ERROR_CODES.VAL_002);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      throw new AppError(400, "Invalid email format", ERROR_CODES.VAL_002);
    }
  }
};

const assertCreatePayload = (data: CreateAdopterInput) => {
  if (!data.name?.trim()) {
    throw new AppError(400, ERROR_CODES.VAL_003, ERROR_CODES.VAL_003);
  }

  assertValidEmail(data.email);
};

const assertUpdatePayload = (data: UpdateAdopterInput) => {
  if (Object.keys(data).length === 0) {
    throw new AppError(
      400,
      "No fields provided for update",
      ERROR_CODES.VAL_003,
    );
  }

  if (data.name !== undefined && !data.name.trim()) {
    throw new AppError(400, "Invalid name", ERROR_CODES.VAL_002);
  }

  assertValidEmail(data.email);
};

// -----------------------------
// Service
// -----------------------------

export class AdoptersService {
  async listAdopters(page = 1, limit = 10) {
    assertValidPagination(page, limit);

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.adopter.findMany({
        skip,
        take: limit,
        orderBy: { id: "desc" },
      }),
      prisma.adopter.count(),
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

  async createAdopter(data: CreateAdopterInput) {
    assertCreatePayload(data);

    return prisma.adopter.create({
      data: {
        name: data.name.trim(),
        email: data.email ?? null,
      },
    });
  }

  async getAdopterById(id: number) {
    assertValidId(id);

    const adopter = await prisma.adopter.findUnique({
      where: { id },
    });

    if (!adopter) {
      throw new AppError(404, "Adopter not found", ERROR_CODES.DATA_001);
    }

    return adopter;
  }

  async updateAdopter(id: number, data: UpdateAdopterInput) {
    assertValidId(id);
    assertUpdatePayload(data);

    await this.getAdopterById(id);

    return prisma.adopter.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
      },
    });
  }

  async deleteAdopter(id: number) {
    assertValidId(id);

    await this.getAdopterById(id);

    await prisma.adopter.delete({
      where: { id },
    });

    return {
      message: "Adopter deleted successfully",
    };
  }
}

export const adoptersService = new AdoptersService();

export type { CreateAdopterInput, UpdateAdopterInput };
