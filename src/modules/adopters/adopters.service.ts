import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { customError } from "../../utils/errorCodes";

interface CreateAdopterInput {
	name: string;
	email?: string;
	partnerId?: number;
}

interface UpdateAdopterInput {
	name?: string;
	email?: string;
	partnerId?: number;
}

// -----------------------------
// Validation Helpers
// -----------------------------

const assertValidId = (id: number) => {
	if (!Number.isInteger(id) || id <= 0) {
		throw new AppError(400, customError("VAL_002"));
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
			customError("VAL_002"),
			"Invalid pagination parameters",
		);
	}
};

const assertValidEmail = (email?: string) => {
	if (email !== undefined) {
		if (typeof email !== "string") {
			throw new AppError(400, customError("VAL_002"), "Invalid email");
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (!emailRegex.test(email)) {
			throw new AppError(400, customError("VAL_004"));
		}
	}
};

const assertValidPartner = async (partnerId: number) => {
	const partner = await prisma.partner.findUnique({
		where: { id: partnerId },
		select: { id: true },
	});

	if (!partner) {
		throw new AppError(404, customError("DATA_001"), "Partner not found");
	}
};

const assertCreatePayload = async (data: CreateAdopterInput) => {
	if (!data.name?.trim()) {
		throw new AppError(400, customError("VAL_003"));
	}

	assertValidEmail(data.email);

	if (data.partnerId) {
		await assertValidPartner(data.partnerId);
	}
};

const assertUpdatePayload = async (data: UpdateAdopterInput) => {
	if (Object.keys(data).length === 0) {
		throw new AppError(
			400,
			customError("VAL_003"),
			"No fields provided for update",
		);
	}

	if (data.name !== undefined && !data.name.trim()) {
		throw new AppError(400, customError("VAL_002"), "Invalid name");
	}

	assertValidEmail(data.email);

	if (data.partnerId) {
		await assertValidPartner(data.partnerId);
	}
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
		await assertCreatePayload(data);

		return prisma.adopter.create({
			data: {
				name: data.name.trim(),
				email: data.email ?? null,
				partnerId: data.partnerId ?? null,
			},
		});
	}

	async getAdopterById(id: number) {
		assertValidId(id);

		const adopter = await prisma.adopter.findUnique({
			where: { id },
		});

		if (!adopter) {
			throw new AppError(404, customError("DATA_001"), "Adopter not found");
		}

		return adopter;
	}

	async updateAdopter(id: number, data: UpdateAdopterInput) {
		assertValidId(id);
		await assertUpdatePayload(data);

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
