import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { ERROR_CODES } from "../../utils/errorCodes";

// Input type for creating a new project with required and optional fields.
type CreateProjectInput = {
  name: string;
  description?: string | null;
  countryId: number;
  adminLocationId: number;
  isActive?: boolean;
};

// Input type for updating an existing project with optional fields for partial changes.
type UpdateProjectInput = {
  name?: string;
  description?: string | null;
  countryId?: number;
  adminLocationId?: number;
  isActive?: boolean;
};

// Checks whether a value is a positive whole number.
const isPositiveInt = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

// Checks whether a value is a non-empty string after trimming spaces.
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

// Validates required fields for creating a project.
const assertCreatePayload = (data: CreateProjectInput) => {
  if (
    !isNonEmptyString(data.name) ||
    !isPositiveInt(data.countryId) ||
    !isPositiveInt(data.adminLocationId)
  ) {
    throw new AppError(400, ERROR_CODES.VAL_003, ERROR_CODES.VAL_003);
  }

  if (
    data.description !== undefined &&
    data.description !== null &&
    typeof data.description !== "string"
  ) {
    throw new AppError(400, "Invalid description", ERROR_CODES.VAL_002);
  }

  if (data.isActive !== undefined && typeof data.isActive !== "boolean") {
    throw new AppError(400, "Invalid isActive value", ERROR_CODES.VAL_002);
  }
};

// Validates provided fields for updating a project.
const assertUpdatePayload = (data: UpdateProjectInput) => {
  if (Object.keys(data).length === 0) {
    throw new AppError(
      400,
      "No fields provided for update",
      ERROR_CODES.VAL_003,
    );
  }

  if (data.name !== undefined && !isNonEmptyString(data.name)) {
    throw new AppError(400, "Invalid project name", ERROR_CODES.VAL_002);
  }

  if (
    data.description !== undefined &&
    data.description !== null &&
    typeof data.description !== "string"
  ) {
    throw new AppError(400, "Invalid description", ERROR_CODES.VAL_002);
  }

  if (data.countryId !== undefined && !isPositiveInt(data.countryId)) {
    throw new AppError(400, "Invalid countryId", ERROR_CODES.VAL_002);
  }

  if (
    data.adminLocationId !== undefined &&
    !isPositiveInt(data.adminLocationId)
  ) {
    throw new AppError(400, "Invalid adminLocationId", ERROR_CODES.VAL_002);
  }

  if (data.isActive !== undefined && typeof data.isActive !== "boolean") {
    throw new AppError(400, "Invalid isActive value", ERROR_CODES.VAL_002);
  }
};

// Verifies that the given country exists in the database.
const ensureCountryExists = async (countryId: number) => {
  const country = await prisma.country.findUnique({
    where: { id: countryId },
    select: { id: true },
  });

  if (!country) {
    throw new AppError(404, "Country not found", ERROR_CODES.DATA_001);
  }
};

// Verifies that the given location exists and returns its details.
const ensureLocationExists = async (locationId: number) => {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: { id: true, countryId: true },
  });

  if (!location) {
    throw new AppError(404, "Location not found", ERROR_CODES.DATA_001);
  }

  return location;
};

// Ensures the selected admin location belongs to the selected country.
const ensureLocationBelongsToCountry = async (
  locationId: number,
  countryId: number,
) => {
  const location = await ensureLocationExists(locationId);

  if (location.countryId !== countryId) {
    throw new AppError(
      400,
      "Selected admin location does not belong to the selected country",
      ERROR_CODES.VAL_001,
    );
  }
};

// Verifies that the project exists and returns its record.
const ensureProjectExists = async (id: number) => {
  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    throw new AppError(404, "Project not found", ERROR_CODES.DATA_001);
  }

  return project;
};

// Service class containing business logic for project management operations.
export class ProjectManagementService {
  // Retrieves all projects ordered by newest first.
  async getAllProjects() {
    try {
      return await prisma.project.findMany({
        orderBy: { createdAt: "desc" },
      });
    } catch {
      throw new AppError(500, ERROR_CODES.SYS_002, ERROR_CODES.SYS_002);
    }
  }

  // Retrieves a single project by its ID.
  async getProjectById(id: number) {
    if (!isPositiveInt(id)) {
      throw new AppError(400, "Invalid project id", ERROR_CODES.VAL_002);
    }

    try {
      return await ensureProjectExists(id);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, ERROR_CODES.SYS_002, ERROR_CODES.SYS_002);
    }
  }

  // Creates a new project after validation checks.
  async createProject(data: CreateProjectInput) {
    assertCreatePayload(data);

    try {
      await ensureCountryExists(data.countryId);
      await ensureLocationBelongsToCountry(
        data.adminLocationId,
        data.countryId,
      );

      const createdProject = await prisma.project.create({
        data: {
          name: data.name.trim(),
          description: data.description?.trim() || null,
          countryId: data.countryId,
          adminLocationId: data.adminLocationId,
          isActive: data.isActive ?? true,
        },
      });

      return createdProject;
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

  // Updates an existing project with provided fields.
  async updateProject(id: number, data: UpdateProjectInput) {
    if (!isPositiveInt(id)) {
      throw new AppError(400, "Invalid project id", ERROR_CODES.VAL_002);
    }

    assertUpdatePayload(data);

    try {
      const existingProject = await ensureProjectExists(id);

      const nextCountryId = data.countryId ?? existingProject.countryId;
      const nextAdminLocationId =
        data.adminLocationId ?? existingProject.adminLocationId;

      if (data.countryId !== undefined) {
        await ensureCountryExists(data.countryId);
      }

      if (data.countryId !== undefined || data.adminLocationId !== undefined) {
        if (
          nextAdminLocationId === null ||
          nextAdminLocationId === undefined ||
          nextCountryId === null ||
          nextCountryId === undefined
        ) {
          throw new AppError(
            400,
            "countryId and adminLocationId are required",
            ERROR_CODES.VAL_003,
          );
        }

        await ensureLocationBelongsToCountry(
          nextAdminLocationId,
          nextCountryId,
        );
      }

      const updatedProject = await prisma.project.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name.trim() } : {}),
          ...(data.description !== undefined
            ? { description: data.description?.trim() || null }
            : {}),
          ...(data.countryId !== undefined
            ? { countryId: data.countryId }
            : {}),
          ...(data.adminLocationId !== undefined
            ? { adminLocationId: data.adminLocationId }
            : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
      });

      return updatedProject;
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

  // Deletes a project only when no dependent records exist.
  async deleteProject(id: number) {
    if (!isPositiveInt(id)) {
      throw new AppError(400, "Invalid project id", ERROR_CODES.VAL_002);
    }

    try {
      await ensureProjectExists(id);

      const [
        dependentScans,
        dependentUserProjects,
        dependentProjectTreeTypes,
        dependentScanBatches,
      ] = await Promise.all([
        prisma.treeScan.count({
          where: { projectId: id },
        }),
        prisma.userProject.count({
          where: { projectId: id },
        }),
        prisma.projectTreeType.count({
          where: { projectId: id },
        }),
        prisma.scanBatch.count({
          where: { projectId: id },
        }),
      ]);

      if (
        dependentScans > 0 ||
        dependentUserProjects > 0 ||
        dependentProjectTreeTypes > 0 ||
        dependentScanBatches > 0
      ) {
        throw new AppError(
          409,
          "Cannot delete project with dependent records",
          ERROR_CODES.VAL_001,
        );
      }

      await prisma.project.delete({
        where: { id },
      });

      return {
        message: "Project deleted successfully",
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(500, ERROR_CODES.SYS_002, ERROR_CODES.SYS_002);
    }
  }
}

export const projectManagementService = new ProjectManagementService();
export type { CreateProjectInput, UpdateProjectInput };
