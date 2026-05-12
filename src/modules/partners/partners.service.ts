import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { ERROR_CODES } from "../../utils/errorCodes";

// These types define what data is expected when creating or updating a partner.
// CreatePartnerInput requires a name, UpdatePartnerInput makes it optional for partial updates.
export type CreatePartnerInput = {
  name: string;
};

export type UpdatePartnerInput = {
  name?: string;
};

// Checks if a value is a valid positive whole number.
// Used to validate IDs coming from URL params.
const isPositiveInt = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

// Checks if a value is a string with actual content after trimming spaces.
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

// Runs before creating a partner.
// Makes sure the name field is present and not just empty spaces.
const assertCreatePayload = (data: CreatePartnerInput) => {
  if (!isNonEmptyString(data.name)) {
    throw new AppError(400, "Partner name is required", ERROR_CODES.VAL_003);
  }
};

// Runs before updating a partner.
// At least one field must be provided, and if name is given it must not be empty.
const assertUpdatePayload = (data: UpdatePartnerInput) => {
  if (Object.keys(data).length === 0) {
    throw new AppError(
      400,
      "No fields provided for update",
      ERROR_CODES.VAL_003,
    );
  }

  if (data.name !== undefined && !isNonEmptyString(data.name)) {
    throw new AppError(
      400,
      "Partner name must not be empty",
      ERROR_CODES.VAL_002,
    );
  }
};

// Looks up a partner by ID.
// If no partner is found, throws a 404 error so the caller gets a clear response.
const ensurePartnerExists = async (id: number) => {
  const partner = await prisma.partner.findUnique({
    where: { id },
  });

  if (!partner) {
    throw new AppError(404, "Partner not found", ERROR_CODES.DATA_001);
  }

  return partner;
};

// All the business logic for partner operations lives here.
// The controller calls these methods and returns the results as HTTP responses.
export class PartnersService {
  // Fetches all partners from the database, newest first.
  async getAllPartners() {
    try {
      return await prisma.partner.findMany({
        orderBy: { createdAt: "desc" },
      });
    } catch {
      throw new AppError(500, ERROR_CODES.SYS_002, ERROR_CODES.SYS_002);
    }
  }

  // Fetches a single partner by ID.
  // Returns 400 if the ID is not a valid number, 404 if the partner does not exist.
  async getPartnerById(id: number) {
    if (!isPositiveInt(id)) {
      throw new AppError(400, "Invalid partner id", ERROR_CODES.VAL_002);
    }

    try {
      return await ensurePartnerExists(id);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, ERROR_CODES.SYS_002, ERROR_CODES.SYS_002);
    }
  }

  // Creates a new partner after validating the request data.
  // Trims the name before saving to avoid accidental whitespace.
  async createPartner(data: CreatePartnerInput) {
    assertCreatePayload(data);

    try {
      const createdPartner = await prisma.partner.create({
        data: {
          name: data.name.trim(),
        },
      });

      return createdPartner;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      // P2002 is Prisma's error code for unique constraint violations.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError(409, ERROR_CODES.DATA_002, ERROR_CODES.DATA_002);
      }

      throw new AppError(500, ERROR_CODES.SYS_002, ERROR_CODES.SYS_002);
    }
  }

  // Updates an existing partner.
  // Only the fields provided in the request body will be changed.
  async updatePartner(id: number, data: UpdatePartnerInput) {
    if (!isPositiveInt(id)) {
      throw new AppError(400, "Invalid partner id", ERROR_CODES.VAL_002);
    }

    assertUpdatePayload(data);

    try {
      // Confirm the partner exists before attempting the update.
      await ensurePartnerExists(id);

      const updatedPartner = await prisma.partner.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        },
      });

      return updatedPartner;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError(409, ERROR_CODES.DATA_002, ERROR_CODES.DATA_002);
      }

      throw new AppError(500, ERROR_CODES.SYS_002, ERROR_CODES.SYS_002);
    }
  }

  // Deletes a partner by ID.
  // Confirms the partner exists first before removing it from the database.
  async deletePartner(id: number) {
    if (!isPositiveInt(id)) {
      throw new AppError(400, "Invalid partner id", ERROR_CODES.VAL_002);
    }

    try {
      await ensurePartnerExists(id);

      await prisma.partner.delete({
        where: { id },
      });

      return { message: "Partner deleted successfully" };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(500, ERROR_CODES.SYS_002, ERROR_CODES.SYS_002);
    }
  }
}

export const partnersService = new PartnersService();
