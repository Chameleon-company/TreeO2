import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const listAdopters = async (
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;

  const adopters = await prisma.adopter.findMany({
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      adoptions: true,
    },
  });

  const total = await prisma.adopter.count();

  return {
    data: adopters,
    pagination: {
      page,
      limit,
      total,
    },
  };
};

export const getAdopterById = async (id: number) => {
  return prisma.adopter.findUnique({
    where: { id },
    include: {
      adoptions: true,
    },
  });
};

export const createAdopter = async (payload: any) => {
  if (!payload.name) {
    throw new Error("Name is required");
  }

  return prisma.adopter.create({
    data: {
      name: payload.name,
      email: payload.email || null,
    },
  });
};

export const updateAdopter = async (
  id: number,
  payload: any
) => {
  const existing = await prisma.adopter.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Adopter not found");
  }

  return prisma.adopter.update({
    where: { id },
    data: {
      name: payload.name,
      email: payload.email,
    },
  });
};

export const deleteAdopter = async (id: number) => {
  const existing = await prisma.adopter.findUnique({
    where: { id },
    include: {
      adoptions: true,
    },
  });

  if (!existing) {
    throw new Error("Adopter not found");
  }

  // Prevent deletion if adoption history exists
  if (existing.adoptions.length > 0) {
    throw new Error(
      "Cannot delete adopter with adoption history"
    );
  }

  return prisma.adopter.delete({
    where: { id },
  });
};