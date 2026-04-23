// services/UserManagementService.ts
// import { PrismaClient } from '@prisma/client';
import { prisma } from "../../lib/prisma";

// const prisma = new PrismaClient();

export const UserManagementService = {
  // Get all users, optionally filtered by project
  getUsers: async (projectId?: string) => {
    return prisma.user.findMany({
      where: projectId
        ? { userProjects: { some: { projectId: Number(projectId) } } }
        : {},
      include: {
        primaryRole: true,
        roleAssignments: { include: { role: true } },
        userProjects: { include: { project: true } },
      },
      orderBy: { name: "asc" },
    });
  },

  // Get a single user by ID
  getUserById: async (id: string) => {
    return prisma.user.findUnique({
      where: { id: Number(id) },
      include: {
        primaryRole: true,
        roleAssignments: { include: { role: true } },
        userProjects: { include: { project: true } },
      },
    });
  },

  // Create a new user
  createUser: async (data: {
    name: string;
    email: string;
    roleId: number;
    projectIds?: number[];
  }) => {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        roleId: data.roleId,
        userProjects: data.projectIds
          ? { create: data.projectIds.map((p) => ({ projectId: p })) }
          : undefined,
      },
      include: { userProjects: true, roleAssignments: true, primaryRole: true },
    });
  },

  // Update an existing user
  updateUser: async (
    id: string,
    data: Partial<{ name: string; email: string; roleId: number }>,
  ) => {
    try {
      return prisma.user.update({
        where: { id: Number(id) },
        data,
        include: {
          userProjects: true,
          roleAssignments: true,
          primaryRole: true,
        },
      });
    } catch (error) {
      console.error("Failed to update user:", error);
      return null;
    }
  },

  // Delete a user (with treeScan check)
  deleteUser: async (id: string) => {
    // Check if the user is linked to any tree scans
    const linkedScan = await prisma.treeScan.findFirst({
      where: { OR: [{ farmerId: Number(id) }, { inspectorId: Number(id) }] },
    });

    if (linkedScan) {
      throw new Error("User linked to scan records");
    }

    try {
      await prisma.user.delete({ where: { id: Number(id) } });
      return true;
    } catch (error) {
      console.error("Failed to delete user:", error);
      return false;
    }
  },
};
