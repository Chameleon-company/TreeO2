import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { ERROR_CODES } from "../../utils/errorCodes";

export type CreateUserProjectRoleInput = {
  userId: number;
  projectId: number;
  roleId: number;
  assignedBy: number;
};

const roleAssignmentInclude = {
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
  role: {
    select: {
      id: true,
      name: true,
    },
  },
  assignedByUser: {
    select: {
      id: true,
      name: true,
    },
  },
};

const isPositiveInt = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

const assertIds = (...ids: number[]) => {
  if (!ids.every(isPositiveInt)) {
    throw new AppError(400, "Invalid ids", ERROR_CODES.VAL_002);
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

const ensureRoleExists = async (roleId: number) => {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: { id: true },
  });
  if (!role) {
    throw new AppError(404, "Role not found", ERROR_CODES.DATA_001);
  }
};

export class UserProjectRoleService {
  async getAssignments(userId: number, role: string) {
    try {
      if (role === "ADMIN") {
        return await prisma.userProjectRole.findMany({
          include: roleAssignmentInclude,
          orderBy: [{ projectId: "asc" }, { userId: "asc" }, { roleId: "asc" }],
        });
      }

      const managerProjects = await prisma.userProject.findMany({
        where: { userId },
        select: { projectId: true },
      });

      const managerProjectIds = managerProjects.map((p) => p.projectId);

      return await prisma.userProjectRole.findMany({
        where: {
          projectId: {
            in: managerProjectIds,
          },
        },
        include: roleAssignmentInclude,
        orderBy: [{ projectId: "asc" }, { userId: "asc" }, { roleId: "asc" }],
      });
    } catch {
      throw new AppError(500, ERROR_CODES.SYS_002, ERROR_CODES.SYS_002);
    }
  }

  async createUserProjectRole(data: CreateUserProjectRoleInput) {
    assertIds(data.userId, data.projectId, data.roleId, data.assignedBy);

    try {
      await ensureUserExists(data.userId);
      await ensureProjectExists(data.projectId);
      await ensureRoleExists(data.roleId);

      const existing = await prisma.userProjectRole.findUnique({
        where: {
          userId_projectId_roleId: {
            userId: data.userId,
            projectId: data.projectId,
            roleId: data.roleId,
          },
        },
      });

      if (existing) {
        throw new AppError(409, ERROR_CODES.DATA_002, ERROR_CODES.DATA_002);
      }

      return await prisma.userProjectRole.create({
        data,
        include: roleAssignmentInclude,
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

  async deleteUserProjectRole(
    userId: number,
    projectId: number,
    roleId: number,
  ) {
    assertIds(userId, projectId, roleId);

    try {
      const existing = await prisma.userProjectRole.findUnique({
        where: {
          userId_projectId_roleId: {
            userId,
            projectId,
            roleId,
          },
        },
      });

      if (!existing) {
        throw new AppError(
          404,
          "User project role not found",
          ERROR_CODES.DATA_001,
        );
      }

      await prisma.userProjectRole.delete({
        where: {
          userId_projectId_roleId: {
            userId,
            projectId,
            roleId,
          },
        },
      });

      return {
        message: "User project role removed successfully",
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(500, ERROR_CODES.SYS_002, ERROR_CODES.SYS_002);
    }
  }
}

export const userProjectRoleService = new UserProjectRoleService();
