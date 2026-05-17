// Dashboard Service 

import { User, UserRole } from "../../types";
import { prisma } from "../../lib/prisma";

export async function getTotals(user: User) {
  // Example: Admin sees all, others see limited
  let totalUsers = 0;
  let totalProjects = 0;
  let totalTrees = 0;
  let totalPartners = 0;

  if (user.role === UserRole.Admin) {
    totalUsers = await prisma.user.count();
    totalProjects = await prisma.project.count();
    totalTrees = await prisma.treeScan.count();
    totalPartners = await prisma.partner.count();
  } else {
    // For non-admin, return only their projects/trees (customize as needed)
    totalUsers = 1;
    totalProjects = await prisma.userProject.count({
      where: { userId: user.id },
    });
    totalTrees = await prisma.treeScan.count({ where: { farmerId: user.id } });
    totalPartners = 0;
  }

  return {
    totalUsers,
    totalProjects,
    totalTrees,
    totalPartners,
    role: user.role,
  };
}

export async function getTreeCounts(user: User) {
  // For admin: count trees by species
  if (user.role === UserRole.Admin) {
    const speciesCounts = await prisma.treeType.findMany({
      select: {
        name: true,
        _count: {
          select: { treeScans: true },
        },
      },
    });
    const species = speciesCounts.map(
      (s: { name: string; _count: { treeScans: number } }) => ({
        name: s.name,
        count: s._count.treeScans,
      }),
    );
    const total = species.reduce(
      (sum: number, s: { name: string; count: number }) => sum + s.count,
      0,
    );
    return { species, total, role: user.role };
  } else {
    // For non-admin, only their trees
    const userTrees = await prisma.treeScan.findMany({
      where: { farmerId: user.id },
      select: { species: { select: { name: true } } },
    });
    const counts: Record<string, number> = {};
    userTrees.forEach((t: { species?: { name?: string } }) => {
      const name = t.species?.name || "Unknown";
      counts[name] = (counts[name] || 0) + 1;
    });
    const species = Object.entries(counts).map(
      ([name, count]: [string, number]) => ({ name, count }),
    );
    const total = userTrees.length;
    return { species, total, role: user.role };
  }
}

export async function getScanStats(user: User) {
  // For admin: all scan stats
  if (user.role === UserRole.Admin) {
    const totalScans = await prisma.treeScan.count();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scansToday = await prisma.treeScan.count({
      where: { createdAt: { gte: today } },
    });
    // Example: status field not in schema, so use isValid/isArchived as proxy
    const pending = await prisma.treeScan.count({ where: { isValid: false } });
    const approved = await prisma.treeScan.count({
      where: { isValid: true, isArchived: false },
    });
    const rejected = await prisma.treeScan.count({
      where: { isArchived: true },
    });
    return {
      totalScans,
      scansToday,
      scansByStatus: {
        pending,
        approved,
        rejected,
      },
      role: user.role,
    };
  } else {
    // For non-admin, only their scans
    const totalScans = await prisma.treeScan.count({
      where: { farmerId: user.id },
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scansToday = await prisma.treeScan.count({
      where: { farmerId: user.id, createdAt: { gte: today } },
    });
    const pending = await prisma.treeScan.count({
      where: { farmerId: user.id, isValid: false },
    });
    const approved = await prisma.treeScan.count({
      where: { farmerId: user.id, isValid: true, isArchived: false },
    });
    const rejected = await prisma.treeScan.count({
      where: { farmerId: user.id, isArchived: true },
    });
    return {
      totalScans,
      scansToday,
      scansByStatus: {
        pending,
        approved,
        rejected,
      },
      role: user.role,
    };
  }
}
