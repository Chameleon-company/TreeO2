import { prisma } from "../../lib/prisma";

interface CreateAdopterInput {
  name?: string;
  email?: string;
}

interface UpdateAdopterInput {
  name?: string;
  email?: string;
}

export const listAdopters = async (
  page = 1,
  limit = 10,
) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.adopter.findMany({
      skip,
      take: limit,
      orderBy: {
        id: "desc",
      },
    }),

    prisma.adopter.count(),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createAdopter = async (
  data: CreateAdopterInput,
) => {
  if (!data.name?.trim()) {
    throw new Error("Name is required");
  }

  return prisma.adopter.create({
    data: {
      name: data.name,
      email: data.email ?? null,
    },
  });
};

export const getAdopterById = async (
  id: number,
) => {
  return prisma.adopter.findUnique({
    where: { id },
  });
};

export const updateAdopter = async (
  id: number,
  data: UpdateAdopterInput,
) => {
  return prisma.adopter.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
    },
  });
};

export const deleteAdopter = async (
  id: number,
) => {
  return prisma.adopter.delete({
    where: { id },
  });
};