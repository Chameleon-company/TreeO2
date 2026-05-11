import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { ERROR_CODES } from "../../utils/errorCodes";

export type AssignUserProjectInput = {
  userId: number;
  projectId: number;
};

const assignmentInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  project: {
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  },
};

const isPositiveInt = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

const assertAssignmentIds = (userId: number, projectId: number) => {
  if (!isPositiveInt(userId) || !isPositiveInt(projectId)) {
    throw new AppError(400, "Invalid userId or projectId", ERROR_CODES.VAL_002);
  }
};

const ensureUserExists = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new AppError(404, "User not found", ERROR_CODES.DATA_001);
  }
};

const ensureProjectExists = async (projectId: number) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  if (!project) {
    throw new AppError(404, "Project not found", ERROR_CODES.DATA_001);
  }
};

export class UserProjectAssignmentService {
  async getAssignments(userId: number, role: string) {
    try {
      if (role === "ADMIN") {
        return await prisma.userProject.findMany({
          include: assignmentInclude,
          orderBy: [{ projectId: "asc" }, { userId: "asc" }],
        });
      }

      const managerProjects = await prisma.userProject.findMany({
        where: { userId },
        select: { projectId: true },
      });

      const managerProjectIds = managerProjects.map(
        (assignment) => assignment.projectId,
      );

      return await prisma.userProject.findMany({
        where: {
          projectId: {
            in: managerProjectIds,
          },
        },
        include: assignmentInclude,
        orderBy: [{ projectId: "asc" }, { userId: "asc" }],
      });
    } catch {
      throw new AppError(500, ERROR_CODES.SYS_002, ERROR_CODES.SYS_002);
    }
  }

  async assignUserToProject(data: AssignUserProjectInput) {
    assertAssignmentIds(data.userId, data.projectId);

    try {
      await ensureUserExists(data.userId);
      await ensureProjectExists(data.projectId);

      const existingAssignment = await prisma.userProject.findUnique({
        where: {
          userId_projectId: {
            userId: data.userId,
            projectId: data.projectId,
          },
        },
      });

      if (existingAssignment) {
        throw new AppError(409, ERROR_CODES.DATA_002, ERROR_CODES.DATA_002);
      }

      return await prisma.userProject.create({
        data: {
          userId: data.userId,
          projectId: data.projectId,
        },
        include: assignmentInclude,
      });
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

  async removeUserFromProject(userId: number, projectId: number) {
    assertAssignmentIds(userId, projectId);

    try {
      const existingAssignment = await prisma.userProject.findUnique({
        where: {
          userId_projectId: {
            userId,
            projectId,
          },
        },
      });

      if (!existingAssignment) {
        throw new AppError(404, "Assignment not found", ERROR_CODES.DATA_001);
      }

      await prisma.userProject.delete({
        where: {
          userId_projectId: {
            userId,
            projectId,
          },
        },
      });

      return {
        message: "User project assignment removed successfully",
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(500, ERROR_CODES.SYS_002, ERROR_CODES.SYS_002);
    }
  }
}

export const userProjectAssignmentService = new UserProjectAssignmentService();
