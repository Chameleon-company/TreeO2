import { ERROR_CODES } from "../../src/utils/errorCodes";
import {
  ProjectManagementService,
} from "../../src/modules/project-management/projectManagement.service";

jest.mock("@prisma/client", () => {
    const mockPrisma = {
        project: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        country: {
            findUnique: jest.fn(),
        },
        location: {
            findUnique: jest.fn(),
        },
        treeScan: {
            count: jest.fn(),
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

    return {
        PrismaClient: jest.fn(() => mockPrisma),
        Prisma: {
            PrismaClientKnownRequestError,
        },
        __mockPrisma: mockPrisma,
    };
});

const { __mockPrisma: mockPrisma } = jest.requireMock("@prisma/client");

// Unit tests for ProjectManagementService business logic.
describe("ProjectManagementService", () => {
    let service: ProjectManagementService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new ProjectManagementService();
    });

    // Tests for retrieving all projects.
    describe("getAllProjects", () => {
        it("should return all projects ordered by newest first", async () => {
            const projects = [
                { id: 2, name: "Project B" },
                { id: 1, name: "Project A" },
            ];

            mockPrisma.project.findMany.mockResolvedValue(projects);

            const result = await service.getAllProjects();

            expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: "desc" },
            });
            expect(result).toEqual(projects);
        });

        it("should throw SYS_002 when fetching projects fails", async () => {
            mockPrisma.project.findMany.mockRejectedValue(new Error("DB failure"));

            await expect(service.getAllProjects()).rejects.toMatchObject({
                statusCode: 500,
                code: ERROR_CODES.SYS_002,
            });
        });
    });

    // Tests for retrieving a single project by id.
    describe("getProjectById", () => {
        it("should return a project when valid id exists", async () => {
            const project = { id: 1, name: "Reforestation Project" };

            mockPrisma.project.findUnique.mockResolvedValue(project);

            const result = await service.getProjectById(1);

            expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
            });
            expect(result).toEqual(project);
        });

        it("should throw VAL_002 when project id is invalid", async () => {
            await expect(service.getProjectById(0)).rejects.toMatchObject({
                statusCode: 400,
                code: ERROR_CODES.VAL_002,
            });
        });

        it("should throw DATA_001 when project is not found", async () => {
            mockPrisma.project.findUnique.mockResolvedValue(null);

            await expect(service.getProjectById(1)).rejects.toMatchObject({
                statusCode: 404,
                code: ERROR_CODES.DATA_001,
                message: "Project not found",
            });
        });
    });

    // Tests for creating a new project.
    describe("createProject", () => {
        it("should create a project successfully with valid input", async () => {
            const createdProject = {
                id: 1,
                name: "Reforestation Project",
                description: "Tree planting initiative",
                countryId: 1,
                adminLocationId: 1,
                isActive: true,
            };

            mockPrisma.country.findUnique.mockResolvedValue({ id: 1 });
            mockPrisma.location.findUnique.mockResolvedValue({ id: 1, countryId: 1 });
            mockPrisma.project.create.mockResolvedValue(createdProject);

            const result = await service.createProject({
                name: "Reforestation Project",
                description: "Tree planting initiative",
                countryId: 1,
                adminLocationId: 1,
                isActive: true,
            });

            expect(mockPrisma.country.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                select: { id: true },
            });

            expect(mockPrisma.location.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                select: { id: true, countryId: true },
            });

            expect(mockPrisma.project.create).toHaveBeenCalledWith({
                data: {
                    name: "Reforestation Project",
                    description: "Tree planting initiative",
                    countryId: 1,
                    adminLocationId: 1,
                    isActive: true,
                },
            });

            expect(result).toEqual(createdProject);
        });

        it("should trim name and description and default isActive to true", async () => {
            const createdProject = {
                id: 1,
                name: "Reforestation Project",
                description: "Tree planting initiative",
                countryId: 1,
                adminLocationId: 1,
                isActive: true,
            };

            mockPrisma.country.findUnique.mockResolvedValue({ id: 1 });
            mockPrisma.location.findUnique.mockResolvedValue({ id: 1, countryId: 1 });
            mockPrisma.project.create.mockResolvedValue(createdProject);

            await service.createProject({
                name: "  Reforestation Project  ",
                description: "  Tree planting initiative  ",
                countryId: 1,
                adminLocationId: 1,
            });

            expect(mockPrisma.project.create).toHaveBeenCalledWith({
                data: {
                    name: "Reforestation Project",
                    description: "Tree planting initiative",
                    countryId: 1,
                    adminLocationId: 1,
                    isActive: true,
                },
            });
        });

        it("should throw VAL_003 when required fields are missing", async () => {
            await expect(
                service.createProject({
                    name: "",
                    countryId: 1,
                    adminLocationId: 1,
                })
            ).rejects.toMatchObject({
                statusCode: 400,
                code: ERROR_CODES.VAL_003,
            });
        });

        it("should throw DATA_001 when country does not exist", async () => {
            mockPrisma.country.findUnique.mockResolvedValue(null);

            await expect(
                service.createProject({
                    name: "Reforestation Project",
                    countryId: 1,
                    adminLocationId: 1,
                })
            ).rejects.toMatchObject({
                statusCode: 404,
                code: ERROR_CODES.DATA_001,
                message: "Country not found",
            });
        });

        it("should throw VAL_001 when location does not belong to selected country", async () => {
            mockPrisma.country.findUnique.mockResolvedValue({ id: 1 });
            mockPrisma.location.findUnique.mockResolvedValue({ id: 1, countryId: 2 });

            await expect(
                service.createProject({
                    name: "Reforestation Project",
                    countryId: 1,
                    adminLocationId: 1,
                })
            ).rejects.toMatchObject({
                statusCode: 400,
                code: ERROR_CODES.VAL_001,
                message: "Selected admin location does not belong to the selected country",
            });
        });

        it("should throw DATA_002 when duplicate error occurs", async () => {
            const { Prisma } = jest.requireMock("@prisma/client");

            mockPrisma.country.findUnique.mockResolvedValue({ id: 1 });
            mockPrisma.location.findUnique.mockResolvedValue({ id: 1, countryId: 1 });
            mockPrisma.project.create.mockRejectedValue(
                new Prisma.PrismaClientKnownRequestError("Duplicate", { code: "P2002" })
            );

            await expect(
                service.createProject({
                    name: "Reforestation Project",
                    countryId: 1,
                    adminLocationId: 1,
                })
            ).rejects.toMatchObject({
                statusCode: 409,
                code: ERROR_CODES.DATA_002,
            });
        });
    });

    // Tests for updating an existing project.
    describe("updateProject", () => {
        it("should update a project successfully with valid input", async () => {
            const existingProject = {
                id: 1,
                name: "Reforestation Project",
                description: "Tree planting initiative",
                countryId: 1,
                adminLocationId: 1,
                isActive: true,
            };

            const updatedProject = {
                ...existingProject,
                name: "Updated Reforestation Project",
                description: "Expanded planting area",
                isActive: false,
            };

            mockPrisma.project.findUnique.mockResolvedValue(existingProject);
            mockPrisma.project.update.mockResolvedValue(updatedProject);

            const result = await service.updateProject(1, {
                name: "Updated Reforestation Project",
                description: "Expanded planting area",
                isActive: false,
            });

            expect(mockPrisma.project.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    name: "Updated Reforestation Project",
                    description: "Expanded planting area",
                    isActive: false,
                },
            });

            expect(result).toEqual(updatedProject);
        });

        it("should throw VAL_003 when update payload is empty", async () => {
            await expect(service.updateProject(1, {})).rejects.toMatchObject({
                statusCode: 400,
                code: ERROR_CODES.VAL_003,
            });
        });

        it("should throw DATA_001 when project is not found", async () => {
            mockPrisma.project.findUnique.mockResolvedValue(null);

            await expect(
                service.updateProject(1, { name: "Updated Name" })
            ).rejects.toMatchObject({
                statusCode: 404,
                code: ERROR_CODES.DATA_001,
                message: "Project not found",
            });
        });

        it("should throw VAL_001 when updated location does not belong to selected country", async () => {
            const existingProject = {
                id: 1,
                name: "Reforestation Project",
                countryId: 1,
                adminLocationId: 1,
                isActive: true,
            };

            mockPrisma.project.findUnique.mockResolvedValue(existingProject);
            mockPrisma.location.findUnique.mockResolvedValue({ id: 2, countryId: 2 });

            await expect(
                service.updateProject(1, { adminLocationId: 2 })
            ).rejects.toMatchObject({
                statusCode: 400,
                code: ERROR_CODES.VAL_001,
                message: "Selected admin location does not belong to the selected country",
            });
        });
    });

    // Tests for deleting a project.
    describe("deleteProject", () => {
        it("should delete a project successfully when no dependent scans exist", async () => {
            const existingProject = {
                id: 1,
                name: "Reforestation Project",
            };

            mockPrisma.project.findUnique.mockResolvedValue(existingProject);
            mockPrisma.treeScan.count.mockResolvedValue(0);
            mockPrisma.project.delete.mockResolvedValue(existingProject);

            const result = await service.deleteProject(1);

            expect(mockPrisma.treeScan.count).toHaveBeenCalledWith({
                where: { projectId: 1 },
            });

            expect(mockPrisma.project.delete).toHaveBeenCalledWith({
                where: { id: 1 },
            });

            expect(result).toEqual({
                message: "Project deleted successfully",
            });
        });

        it("should throw DATA_001 when project is not found", async () => {
            mockPrisma.project.findUnique.mockResolvedValue(null);

            await expect(service.deleteProject(1)).rejects.toMatchObject({
                statusCode: 404,
                code: ERROR_CODES.DATA_001,
                message: "Project not found",
            });
        });

        it("should throw VAL_001 when dependent scans exist", async () => {
            const existingProject = {
                id: 1,
                name: "Reforestation Project",
            };

            mockPrisma.project.findUnique.mockResolvedValue(existingProject);
            mockPrisma.treeScan.count.mockResolvedValue(2);

            await expect(service.deleteProject(1)).rejects.toMatchObject({
                statusCode: 409,
                code: ERROR_CODES.VAL_001,
                message: "Cannot delete project with dependent scans",
            });
        });
    });
});