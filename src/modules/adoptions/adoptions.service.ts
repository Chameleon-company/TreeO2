import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { customError } from "../../utils/errorCodes";

interface CreateAdoptionInput {
	adopter_id: number;
	fob_id: string;
	adopted_at: string;
}

interface UpdateAdoptionInput {
	adopter_id?: number;
	fob_id?: string;
	adopted_at?: string;
}

interface ListAdoptionsFilters {
	page?: number;
	limit?: number;
	fob_id?: string;
	adopter_id?: number;
	adopter?: string;
	year?: number;
}

const assertValidId = (id: number) => {
	if (!Number.isInteger(id) || id <= 0) {
		throw new AppError(400, customError("VAL_002"), "Invalid ID");
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

const assertValidYear = (year: number) => {
	const currentYear = new Date().getFullYear();

	if (!Number.isInteger(year) || year < 1900 || year > currentYear) {
		throw new AppError(400, customError("VAL_002"), "Invalid year filter");
	}
};

const parseStrictDate = (date: string) => {
	if (typeof date !== "string" || !date.trim()) {
		throw new AppError(400, customError("VAL_003"), "adopted_at is required");
	}

	const trimmedDate = date.trim();
	const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

	if (!dateRegex.test(trimmedDate)) {
		throw new AppError(
			400,
			customError("VAL_002"),
			"Adoption date must use YYYY-MM-DD format",
		);
	}

	const parsedDate = new Date(`${trimmedDate}T00:00:00.000Z`);

	if (Number.isNaN(parsedDate.getTime())) {
		throw new AppError(400, customError("VAL_002"), "Invalid adoption date");
	}

	const [year, month, day] = trimmedDate.split("-").map(Number);

	if (
		parsedDate.getUTCFullYear() !== year ||
		parsedDate.getUTCMonth() + 1 !== month ||
		parsedDate.getUTCDate() !== day
	) {
		throw new AppError(400, customError("VAL_002"), "Invalid adoption date");
	}

	const today = new Date();
	today.setUTCHours(23, 59, 59, 999);

	if (parsedDate > today) {
		throw new AppError(
			400,
			customError("VAL_005"),
			"Adoption date cannot be in the future",
		);
	}

	return parsedDate;
};

const assertCreatePayload = (data: CreateAdoptionInput) => {
	if (data.adopter_id === undefined || data.adopter_id === null) {
		throw new AppError(400, customError("VAL_003"), "adopter_id is required");
	}

	assertValidId(Number(data.adopter_id));

	if (!data.fob_id?.trim()) {
		throw new AppError(400, customError("VAL_003"), "fob_id is required");
	}

	parseStrictDate(data.adopted_at);
};

const assertUpdatePayload = (data: UpdateAdoptionInput) => {
	if (Object.keys(data).length === 0) {
		throw new AppError(
			400,
			customError("VAL_003"),
			"No fields provided for update",
		);
	}

	if (data.adopter_id !== undefined) {
		assertValidId(Number(data.adopter_id));
	}

	if (data.fob_id !== undefined && !data.fob_id.trim()) {
		throw new AppError(400, customError("VAL_002"), "Invalid fob_id");
	}

	if (data.adopted_at !== undefined) {
		parseStrictDate(data.adopted_at);
	}
};

export class AdoptionsService {
	async listAdoptions(filters: ListAdoptionsFilters = {}) {
		const page = filters.page === undefined ? 1 : Number(filters.page);

		const limit = filters.limit === undefined ? 10 : Number(filters.limit);

		assertValidPagination(page, limit);

		const skip = (page - 1) * limit;

		const where: Prisma.AdoptionWhereInput = {};

		if (filters.fob_id !== undefined) {
			if (!filters.fob_id.trim()) {
				throw new AppError(
					400,
					customError("VAL_002"),
					"Invalid fob_id filter",
				);
			}

			where.fobId = {
				contains: filters.fob_id.trim(),
				mode: "insensitive",
			};
		}

		if (filters.adopter_id !== undefined) {
			assertValidId(Number(filters.adopter_id));

			where.adopterId = Number(filters.adopter_id);
		}

		if (filters.adopter !== undefined) {
			if (!filters.adopter.trim()) {
				throw new AppError(
					400,
					customError("VAL_002"),
					"Invalid adopter filter",
				);
			}

			where.adopter = {
				name: {
					contains: filters.adopter.trim(),
					mode: "insensitive",
				},
			};
		}

		if (filters.year !== undefined) {
			const year = Number(filters.year);

			assertValidYear(year);

			where.adoptedAt = {
				gte: new Date(`${year}-01-01T00:00:00.000Z`),
				lte: new Date(`${year}-12-31T23:59:59.999Z`),
			};
		}

		const [data, total] = await Promise.all([
			prisma.adoption.findMany({
				where,
				skip,
				take: limit,
				orderBy: { id: "desc" },
				include: {
					adopter: true,
				},
			}),

			prisma.adoption.count({ where }),
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

	async createAdoption(data: CreateAdoptionInput) {
		assertCreatePayload(data);

		const adopter = await prisma.adopter.findUnique({
			where: { id: Number(data.adopter_id) },
		});

		if (!adopter) {
			throw new AppError(404, customError("DATA_001"), "Adopter not found");
		}

		return prisma.adoption.create({
			data: {
				adopterId: Number(data.adopter_id),
				fobId: data.fob_id.trim(),
				adoptedAt: parseStrictDate(data.adopted_at),
			},
		});
	}

	async getAdoptionById(id: number) {
		assertValidId(id);

		const adoption = await prisma.adoption.findUnique({
			where: { id },
			include: {
				adopter: true,
			},
		});

		if (!adoption) {
			throw new AppError(404, customError("DATA_001"), "Adoption not found");
		}

		return adoption;
	}

	async updateAdoption(id: number, data: UpdateAdoptionInput) {
		assertValidId(id);

		assertUpdatePayload(data);

		await this.getAdoptionById(id);

		if (data.adopter_id !== undefined) {
			const adopter = await prisma.adopter.findUnique({
				where: { id: Number(data.adopter_id) },
			});

			if (!adopter) {
				throw new AppError(404, customError("DATA_001"), "Adopter not found");
			}
		}

		return prisma.adoption.update({
			where: { id },

			data: {
				...(data.adopter_id !== undefined
					? { adopterId: Number(data.adopter_id) }
					: {}),

				...(data.fob_id !== undefined ? { fobId: data.fob_id.trim() } : {}),

				...(data.adopted_at !== undefined
					? { adoptedAt: parseStrictDate(data.adopted_at) }
					: {}),
			},
		});
	}

	async deleteAdoption(id: number) {
		assertValidId(id);

		await this.getAdoptionById(id);

		await prisma.adoption.delete({
			where: { id },
		});

		return {
			message: "Adoption deleted successfully",
		};
	}
}

export const adoptionsService = new AdoptionsService();

export type { CreateAdoptionInput, UpdateAdoptionInput, ListAdoptionsFilters };
