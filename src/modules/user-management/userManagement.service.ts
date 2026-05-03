import { prisma } from "../../lib/prisma";
import { ERROR_CODES } from "../../utils/errorCodes";
import { AppError } from "../../middleware/errorHandler";
import type { Prisma } from "@prisma/client";

export type AuthUser = {
  id: number;
  role: string;
  projectIds?: number[];
};

export type CreateUserInput = {
  name: string;
  email: string;
  roleId: number;
  projectIds?: number[];
};

type UpdateUserInput = Partial<CreateUserInput>;

const userSelect = {
  id: true,
  name: true,
  email: true,
  accountActive: true,
  canSignIn: true,
  primaryRole: true,
  roleAssignments: { include: { role: true } },
  userProjects: { include: { project: true } },
};

const validateRole = (role: string) => {
  const valid = ["ADMIN", "MANAGER", "INSPECTOR", "FARMER"];
  if (!valid.includes(role)) {
    throw new AppError(403, ERROR_CODES.AUTH_004, ERROR_CODES.AUTH_004);
  }
};

export const UserManagementService = {
  getUsers: async (authUser: AuthUser, projectId?: string) => {
    validateRole(authUser.role);

    const parsed = projectId ? Number(projectId) : undefined;

    if (projectId && Number.isNaN(parsed)) {
      throw new AppError(400, ERROR_CODES.VAL_002, ERROR_CODES.VAL_002);
    }

    const where: Prisma.UserWhereInput = {};

    if (authUser.role === "ADMIN") {
      if (parsed !== undefined) {
        where.userProjects = { some: { projectId: parsed } };
      }

      return prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { name: "asc" },
      });
    }

    if (authUser.role === "MANAGER") {
      const allowed = authUser.projectIds ?? [];

      if (parsed !== undefined && !allowed.includes(parsed)) {
        throw new AppError(403, ERROR_CODES.AUTH_004, ERROR_CODES.AUTH_004);
      }

      where.userProjects = parsed
        ? { some: { projectId: parsed } }
        : { some: { projectId: { in: allowed } } };

      return prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { name: "asc" },
      });
    }

    throw new AppError(403, ERROR_CODES.AUTH_004, ERROR_CODES.AUTH_004);
  },

  getUserById: async (authUser: AuthUser, id: string) => {
    validateRole(authUser.role);

    const userId = Number(id);

    if (Number.isNaN(userId)) {
      throw new AppError(400, ERROR_CODES.VAL_002, ERROR_CODES.VAL_002);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!user) {
      throw new AppError(404, ERROR_CODES.DATA_001, ERROR_CODES.DATA_001);
    }

    if (authUser.role === "ADMIN") {
      return user;
    }

    if (authUser.role === "MANAGER") {
      const allowed = user.userProjects?.some((p) =>
        authUser.projectIds?.includes(p.projectId),
      );

      if (!allowed) {
        throw new AppError(403, ERROR_CODES.AUTH_004, ERROR_CODES.AUTH_004);
      }

      return user;
    }

    if (authUser.role === "INSPECTOR" || authUser.role === "FARMER") {
      if (authUser.id !== userId) {
        throw new AppError(403, ERROR_CODES.AUTH_004, ERROR_CODES.AUTH_004);
      }
      return user;
    }

    throw new AppError(403, ERROR_CODES.AUTH_004, ERROR_CODES.AUTH_004);
  },

  createUser: async (data: CreateUserInput) => {
    if (!data.name?.trim()) {
      throw new AppError(400, ERROR_CODES.VAL_003, ERROR_CODES.VAL_003);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new AppError(400, ERROR_CODES.VAL_003, ERROR_CODES.VAL_003);
    }

    const role = await prisma.role.findUnique({
      where: { id: data.roleId },
    });

    if (!role) {
      throw new AppError(400, ERROR_CODES.VAL_003, ERROR_CODES.VAL_003);
    }

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new AppError(409, ERROR_CODES.DATA_002, ERROR_CODES.DATA_002);
    }

    return prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim(),
        roleId: data.roleId,
      },
      select: userSelect,
    });
  },

  updateUser: async (authUser: AuthUser, id: string, data: UpdateUserInput) => {
    validateRole(authUser.role);

    const userId = Number(id);

    if (Number.isNaN(userId)) {
      throw new AppError(400, ERROR_CODES.VAL_002, ERROR_CODES.VAL_002);
    }

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      include: { userProjects: true },
    });

    if (!existing) {
      throw new AppError(404, ERROR_CODES.DATA_001, ERROR_CODES.DATA_001);
    }

    if (authUser.role === "MANAGER") {
      const allowed = existing.userProjects.some((p) =>
        authUser.projectIds?.includes(p.projectId),
      );

      if (!allowed) {
        throw new AppError(403, ERROR_CODES.AUTH_004, ERROR_CODES.AUTH_004);
      }

      const restricted = ["roleId", "accountActive", "canSignIn"];

      const hasRestricted = restricted.some((f) =>
        Object.prototype.hasOwnProperty.call(data, f),
      );

      if (hasRestricted) {
        throw new AppError(403, ERROR_CODES.AUTH_004, ERROR_CODES.AUTH_004);
      }
    }

    return prisma.user.update({
      where: { id: userId },
      data,
      select: userSelect,
    });
  },

  deleteUser: async (id: string) => {
    const userId = Number(id);

    if (Number.isNaN(userId)) {
      throw new AppError(400, ERROR_CODES.VAL_002, ERROR_CODES.VAL_002);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, ERROR_CODES.DATA_001, ERROR_CODES.DATA_001);
    }

    const linked = await prisma.treeScan.findFirst({
      where: {
        OR: [{ farmerId: userId }, { inspectorId: userId }],
      },
    });

    if (linked) {
      throw new AppError(409, ERROR_CODES.VAL_001, ERROR_CODES.VAL_001);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        accountActive: false,
        canSignIn: false,
      },
    });

    return true;
  },
};
