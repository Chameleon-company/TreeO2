import { customError } from "../../src/utils/errorCodes";
import { projectOrganisationService } from "../../src/modules/project-organisation/projectOrganisation.service";
import {
	ProjectOrganisationReqBody,
	ProjectOrganisationReqParams,
} from "../../src/modules/project-organisation/projectOrganisation.schema";
import { AccessType } from "@prisma/client";

jest.mock("@prisma/client", () => {
	const mockPrisma = {
		projectOrganisation: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			create: jest.fn(),
			delete: jest.fn(),
		},
		project: {
			findUnique: jest.fn(),
		},
		organisation: {
			findUnique: jest.fn(),
		},
	};

	class PrismaClientKnownRequestError extends Error {
		code: string;

		constructor(message: string, options: { code: string }) {
			super(message);
			this.code = options.code;
			this.name = "PrismaClientKnownRequestError";
		}
	}

	const AccessType = {
		shared: "shared",
		owner: "owner",
		partner: "partner",
	} as const;

	return {
		PrismaClient: jest.fn(() => mockPrisma),
		Prisma: {
			PrismaClientKnownRequestError,
		},
		AccessType,
		__mockPrisma: mockPrisma,
	};
});

const { __mockPrisma: mockPrisma } = jest.requireMock("@prisma/client");

// Schema validation tests
describe("ProjectOrganisation Schemas", () => {
	describe("ProjectOrganisationReqBody", () => {
		it("should validate a valid request body", () => {
			const result = ProjectOrganisationReqBody.safeParse({
				projectId: 1,
				organisationId: 2,
				accessType: "shared",
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual({
					projectId: 1,
					organisationId: 2,
					accessType: "shared",
				});
			}
		});

		it("should default accessType to 'shared' when omitted", () => {
			const result = ProjectOrganisationReqBody.safeParse({
				projectId: 1,
				organisationId: 2,
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.accessType).toBe("shared");
			}
		});

		it("should validate all valid accessType values", () => {
			const validAccessTypes: AccessType[] = ["shared", "owner", "partner"];

			for (const accessType of validAccessTypes) {
				const result = ProjectOrganisationReqBody.safeParse({
					projectId: 1,
					organisationId: 2,
					accessType,
				});

				expect(result.success).toBe(true);
			}
		});

		it("should reject invalid accessType values", () => {
			const result = ProjectOrganisationReqBody.safeParse({
				projectId: 1,
				organisationId: 2,
				accessType: "invalid_type",
			});

			expect(result.success).toBe(false);
		});

		it("should reject non-positive projectId", () => {
			const result = ProjectOrganisationReqBody.safeParse({
				projectId: -1,
				organisationId: 2,
				accessType: "shared",
			});

			expect(result.success).toBe(false);
		});

		it("should reject non-positive organisationId", () => {
			const result = ProjectOrganisationReqBody.safeParse({
				projectId: 1,
				organisationId: -1,
				accessType: "shared",
			});

			expect(result.success).toBe(false);
		});

		it("should reject zero as projectId", () => {
			const result = ProjectOrganisationReqBody.safeParse({
				projectId: 0,
				organisationId: 2,
				accessType: "shared",
			});

			expect(result.success).toBe(false);
		});

		it("should reject zero as organisationId", () => {
			const result = ProjectOrganisationReqBody.safeParse({
				projectId: 1,
				organisationId: 0,
				accessType: "shared",
			});

			expect(result.success).toBe(false);
		});

		it("should reject non-integer projectId", () => {
			const result = ProjectOrganisationReqBody.safeParse({
				projectId: 1.5,
				organisationId: 2,
				accessType: "shared",
			});

			expect(result.success).toBe(false);
		});

		it("should reject non-integer organisationId", () => {
			const result = ProjectOrganisationReqBody.safeParse({
				projectId: 1,
				organisationId: 2.5,
				accessType: "shared",
			});

			expect(result.success).toBe(false);
		});

		it("should reject missing projectId", () => {
			const result = ProjectOrganisationReqBody.safeParse({
				organisationId: 2,
				accessType: "shared",
			});

			expect(result.success).toBe(false);
		});

		it("should reject missing organisationId", () => {
			const result = ProjectOrganisationReqBody.safeParse({
				projectId: 1,
				accessType: "shared",
			});

			expect(result.success).toBe(false);
		});
	});

	describe("ProjectOrganisationReqParams", () => {
		it("should validate valid params with string input", () => {
			const result = ProjectOrganisationReqParams.safeParse({
				projectId: "1",
				organisationId: "2",
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.projectId).toBe(1);
				expect(result.data.organisationId).toBe(2);
			}
		});

		it("should validate valid params with number input", () => {
			const result = ProjectOrganisationReqParams.safeParse({
				projectId: 1,
				organisationId: 2,
			});

			expect(result.success).toBe(true);
		});

		it("should reject non-positive projectId", () => {
			const result = ProjectOrganisationReqParams.safeParse({
				projectId: "-1",
				organisationId: "2",
			});

			expect(result.success).toBe(false);
		});

		it("should reject non-positive organisationId", () => {
			const result = ProjectOrganisationReqParams.safeParse({
				projectId: "1",
				organisationId: "-2",
			});

			expect(result.success).toBe(false);
		});

		it("should reject missing projectId", () => {
			const result = ProjectOrganisationReqParams.safeParse({
				organisationId: "2",
			});

			expect(result.success).toBe(false);
		});

		it("should reject missing organisationId", () => {
			const result = ProjectOrganisationReqParams.safeParse({
				projectId: "1",
			});

			expect(result.success).toBe(false);
		});

		it("should reject non-numeric string projectId", () => {
			const result = ProjectOrganisationReqParams.safeParse({
				projectId: "abc",
				organisationId: "2",
			});

			expect(result.success).toBe(false);
		});

		it("should reject non-numeric string organisationId", () => {
			const result = ProjectOrganisationReqParams.safeParse({
				projectId: "1",
				organisationId: "xyz",
			});

			expect(result.success).toBe(false);
		});
	});
});

// Unit tests for ProjectOrganisationService business logic.
describe("ProjectOrganisationService", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("getAllProjectOrganisations", () => {
		it("should return all project-organisations ordered by newest first", async () => {
			const entries = [
				{ projectId: 2, organisationId: 1, accessType: "shared" },
				{ projectId: 1, organisationId: 2, accessType: "partner" },
			];

			mockPrisma.projectOrganisation.findMany.mockResolvedValue(entries);

			const result =
				await projectOrganisationService.getAllProjectOrganisations();

			expect(mockPrisma.projectOrganisation.findMany).toHaveBeenCalledWith({
				orderBy: { createdAt: "desc" },
			});
			expect(result).toEqual(entries);
		});

		it("should return empty array when no entries exist", async () => {
			mockPrisma.projectOrganisation.findMany.mockResolvedValue([]);

			const result =
				await projectOrganisationService.getAllProjectOrganisations();

			expect(result).toEqual([]);
		});
	});

	describe("createProjectOrganisation", () => {
		it("should create a project-organisation entry successfully", async () => {
			const created = {
				projectId: 1,
				organisationId: 2,
				accessType: "shared",
			};

			mockPrisma.project.findUnique.mockResolvedValue({ id: 1 });
			mockPrisma.organisation.findUnique.mockResolvedValue({ id: 2 });
			mockPrisma.projectOrganisation.create.mockResolvedValue(created);

			const result = await projectOrganisationService.createProjectOrganisation(
				1,
				2,
				"shared",
			);

			expect(mockPrisma.projectOrganisation.create).toHaveBeenCalledWith({
				data: {
					projectId: 1,
					organisationId: 2,
					accessType: "shared",
				},
			});

			expect(result).toEqual(created);
		});

		it("should create with accessType shared", async () => {
			const created = {
				projectId: 1,
				organisationId: 2,
				accessType: "shared",
			};

			mockPrisma.project.findUnique.mockResolvedValue({ id: 1 });
			mockPrisma.organisation.findUnique.mockResolvedValue({ id: 2 });
			mockPrisma.projectOrganisation.create.mockResolvedValue(created);

			await projectOrganisationService.createProjectOrganisation(
				1,
				2,
				"shared",
			);

			expect(mockPrisma.projectOrganisation.create).toHaveBeenCalledWith({
				data: {
					projectId: 1,
					organisationId: 2,
					accessType: "shared",
				},
			});
		});

		it("should create with accessType partner", async () => {
			const created = {
				projectId: 1,
				organisationId: 2,
				accessType: "partner",
			};

			mockPrisma.project.findUnique.mockResolvedValue({ id: 1 });
			mockPrisma.organisation.findUnique.mockResolvedValue({ id: 2 });
			mockPrisma.projectOrganisation.create.mockResolvedValue(created);

			await projectOrganisationService.createProjectOrganisation(
				1,
				2,
				"partner",
			);

			expect(mockPrisma.projectOrganisation.create).toHaveBeenCalledWith({
				data: {
					projectId: 1,
					organisationId: 2,
					accessType: "partner",
				},
			});
		});

		it("should throw VAL_002 when accessType is owner", async () => {
			mockPrisma.project.findUnique.mockResolvedValue({ id: 1 });
			mockPrisma.organisation.findUnique.mockResolvedValue({ id: 2 });
			const err = customError("VAL_002");

			await expect(
				projectOrganisationService.createProjectOrganisation(1, 2, "owner"),
			).rejects.toMatchObject({
				statusCode: 422,
				code: err.code,
				message: err.message,
				detail: "Access type can't be owner",
			});

			expect(mockPrisma.projectOrganisation.create).not.toHaveBeenCalled();
		});

		it("should throw DATA_001 when project does not exist", async () => {
			mockPrisma.project.findUnique.mockResolvedValue(null);
			mockPrisma.organisation.findUnique.mockResolvedValue({ id: 2 });
			const err = customError("DATA_001");

			await expect(
				projectOrganisationService.createProjectOrganisation(999, 2, "shared"),
			).rejects.toMatchObject({
				statusCode: 404,
				code: err.code,
				message: err.message,
				detail: "Project not found",
			});

			expect(mockPrisma.projectOrganisation.create).not.toHaveBeenCalled();
		});

		it("should throw DATA_001 when organisation does not exist", async () => {
			mockPrisma.project.findUnique.mockResolvedValue({ id: 1 });
			mockPrisma.organisation.findUnique.mockResolvedValue(null);

			const err = customError("DATA_001");
			await expect(
				projectOrganisationService.createProjectOrganisation(1, 999, "shared"),
			).rejects.toMatchObject({
				statusCode: 404,
				code: err.code,
				message: err.message,
				detail: "Organisation not found",
			});

			expect(mockPrisma.projectOrganisation.create).not.toHaveBeenCalled();
		});

		it("should throw DATA_002 on duplicate entry error (P2002)", async () => {
			const { Prisma } = jest.requireMock("@prisma/client");

			mockPrisma.project.findUnique.mockResolvedValue({ id: 1 });
			mockPrisma.organisation.findUnique.mockResolvedValue({ id: 2 });
			mockPrisma.projectOrganisation.create.mockRejectedValue(
				new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
					code: "P2002",
				}),
			);

			await expect(
				projectOrganisationService.createProjectOrganisation(1, 2, "shared"),
			).rejects.toMatchObject({
				code: "P2002",
				message: "Unique constraint failed",
			});
		});
	});

	describe("deleteProjectOrganisation", () => {
		it("should delete a project-organisation entry successfully", async () => {
			const existingEntry = {
				projectId: 1,
				organisationId: 2,
				accessType: "shared",
			};

			mockPrisma.projectOrganisation.findUnique.mockResolvedValue(
				existingEntry,
			);
			mockPrisma.projectOrganisation.delete.mockResolvedValue(existingEntry);

			const result = await projectOrganisationService.deleteProjectOrganisation(
				1,
				2,
			);

			expect(result).toEqual({
				message: "Project organisation sharing removed successfully",
			});
		});

		it("should delete with accessType partner", async () => {
			const existingEntry = {
				projectId: 1,
				organisationId: 2,
				accessType: "partner",
			};

			mockPrisma.projectOrganisation.findUnique.mockResolvedValue(
				existingEntry,
			);
			mockPrisma.projectOrganisation.delete.mockResolvedValue(existingEntry);

			const result = await projectOrganisationService.deleteProjectOrganisation(
				1,
				2,
			);

			expect(result).toEqual({
				message: "Project organisation sharing removed successfully",
			});
		});

		it("should throw DATA_001 when entry does not exist", async () => {
			mockPrisma.projectOrganisation.findUnique.mockResolvedValue(null);

			const err = customError("DATA_001");

			await expect(
				projectOrganisationService.deleteProjectOrganisation(1, 2),
			).rejects.toMatchObject({
				statusCode: 404,
				code: err.code,
				message: err.message,
				detail: "Project-organisation sharing link not found",
			});
		});

		it("should throw VAL_002 when entry accessType is owner", async () => {
			const ownerEntry = {
				projectId: 1,
				organisationId: 2,
				accessType: "owner",
			};

			mockPrisma.projectOrganisation.findUnique.mockResolvedValue(ownerEntry);
			mockPrisma.projectOrganisation.delete.mockResolvedValue(ownerEntry);

			const err = customError("VAL_002");

			await expect(
				projectOrganisationService.deleteProjectOrganisation(1, 2),
			).rejects.toMatchObject({
				statusCode: 422,
				code: err.code,
				message: err.message,
				detail: "Access type can't be owner",
			});

			expect(mockPrisma.projectOrganisation.delete).not.toHaveBeenCalled();
		});
	});
});
