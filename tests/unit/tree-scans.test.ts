import { ERROR_CODES } from "../../src/utils/errorCodes";
import { TreeScansService } from "../../src/modules/tree-scans/treeScans.service";

jest.mock("@prisma/client", () => {
    const mockPrisma: any = {
        project: {
            findUnique: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
        userProject: {
            findUnique: jest.fn(),
        },
        treeType: {
            findUnique: jest.fn(),
        },
        projectTreeType: {
            findUnique: jest.fn(),
        },
        treeScan: {
            findMany: jest.fn(),
            count: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
        },
        treeScanAudit: {
            create: jest.fn(),
        },
    };

    mockPrisma.$transaction = jest.fn((callback: any) => callback(mockPrisma));

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

// Unit tests for TreeScansService business logic.
describe("TreeScansService", () => {
    let service: TreeScansService;

    const adminUser = {
        id: 1,
        role: "ADMIN",
    };

    const managerUser = {
        id: 10,
        role: "MANAGER",
    };

    const inspectorUser = {
        id: 4,
        role: "INSPECTOR",
    };

    const validCreateInput = {
        fobId: "FOB-001",
        projectId: 1,
        farmerId: 2,
        inspectorId: 4,
        speciesId: 3,
        estimatedPlantedYear: 2020,
        estimatedPlantedMonth: 6,
        plantedDate: new Date("2020-06-10"),
        heightM: 3.25,
        circumferenceCm: 18.4,
        diameterCm: 5.8,
        latitude: -37.8136,
        longitude: 144.9631,
        photoId: "550e8400-e29b-41d4-a716-446655440000",
        batchId: 1,
        deviceId: "DEVICE-001",
        validationNotes: "Healthy tree",
    };

    const treeScanRecord = {
        id: 1,
        ...validCreateInput,
        isArchived: false,
        isCorrected: false,
        correctedBy: null,
        correctionReason: null,
        isValid: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        service = new TreeScansService();
    });

    // Tests for listing tree scans.
    describe("listTreeScans", () => {
        it("should return paginated tree scans with filters", async () => {
            mockPrisma.treeScan.findMany.mockResolvedValue([treeScanRecord]);
            mockPrisma.treeScan.count.mockResolvedValue(1);

            const result = await service.listTreeScans(
                {
                    page: 1,
                    limit: 10,
                    projectId: 1,
                    farmerId: 2,
                    inspectorId: 4,
                    speciesId: 3,
                    batchId: 1,
                    isArchived: false,
                    isValid: true,
                },
                adminUser,
            );

            expect(mockPrisma.treeScan.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        projectId: 1,
                        farmerId: 2,
                        inspectorId: 4,
                        speciesId: 3,
                        batchId: 1,
                        isArchived: false,
                        isValid: true,
                    },
                    skip: 0,
                    take: 10,
                    orderBy: { createdAt: "desc" },
                }),
            );

            expect(result).toEqual({
                data: [treeScanRecord],
                meta: {
                    page: 1,
                    limit: 10,
                    total: 1,
                    totalPages: 1,
                },
            });
        });

        it("should scope manager list results to assigned projects", async () => {
            mockPrisma.treeScan.findMany.mockResolvedValue([treeScanRecord]);
            mockPrisma.treeScan.count.mockResolvedValue(1);

            await service.listTreeScans({ page: 1, limit: 10 }, managerUser);

            expect(mockPrisma.treeScan.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        project: {
                            userProjects: {
                                some: {
                                    userId: managerUser.id,
                                },
                            },
                        },
                    },
                    skip: 0,
                    take: 10,
                    orderBy: { createdAt: "desc" },
                }),
            );
        });

        it("should scope inspector list results to own scans", async () => {
            mockPrisma.treeScan.findMany.mockResolvedValue([treeScanRecord]);
            mockPrisma.treeScan.count.mockResolvedValue(1);

            await service.listTreeScans({ page: 1, limit: 10 }, inspectorUser);

            expect(mockPrisma.treeScan.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        inspectorId: inspectorUser.id,
                    },
                    skip: 0,
                    take: 10,
                    orderBy: { createdAt: "desc" },
                }),
            );
        });

        it("should throw SYS_002 when listing tree scans fails", async () => {
            mockPrisma.treeScan.findMany.mockRejectedValue(new Error("DB failure"));

            await expect(
                service.listTreeScans({ page: 1, limit: 10 }, adminUser),
            ).rejects.toMatchObject({
                statusCode: 500,
                code: ERROR_CODES.SYS_002,
            });
        });
    });

    // Tests for retrieving a single tree scan.
    describe("getTreeScanById", () => {
        it("should return a tree scan when it exists", async () => {
            mockPrisma.treeScan.findUnique.mockResolvedValue(treeScanRecord);

            const result = await service.getTreeScanById(1, adminUser);

            expect(mockPrisma.treeScan.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 1 },
                }),
            );

            expect(result).toEqual(treeScanRecord);
        });

        it("should allow inspector to access own scan", async () => {
            mockPrisma.treeScan.findUnique.mockResolvedValue(treeScanRecord);

            const result = await service.getTreeScanById(1, inspectorUser);

            expect(result).toEqual(treeScanRecord);
        });

        it("should throw AUTH_004 when inspector accesses another inspector scan", async () => {
            mockPrisma.treeScan.findUnique.mockResolvedValue({
                ...treeScanRecord,
                inspectorId: 999,
            });

            await expect(
                service.getTreeScanById(1, inspectorUser),
            ).rejects.toMatchObject({
                statusCode: 403,
                code: ERROR_CODES.AUTH_004,
            });
        });

        it("should allow manager to access scan from assigned project", async () => {
            mockPrisma.treeScan.findUnique.mockResolvedValue(treeScanRecord);
            mockPrisma.userProject.findUnique.mockResolvedValue({
                userId: managerUser.id,
                projectId: treeScanRecord.projectId,
            });

            const result = await service.getTreeScanById(1, managerUser);

            expect(mockPrisma.userProject.findUnique).toHaveBeenCalledWith({
                where: {
                    userId_projectId: {
                        userId: managerUser.id,
                        projectId: treeScanRecord.projectId,
                    },
                },
            });

            expect(result).toEqual(treeScanRecord);
        });

        it("should throw AUTH_007 when manager accesses scan from unassigned project", async () => {
            mockPrisma.treeScan.findUnique.mockResolvedValue(treeScanRecord);
            mockPrisma.userProject.findUnique.mockResolvedValue(null);

            await expect(
                service.getTreeScanById(1, managerUser),
            ).rejects.toMatchObject({
                statusCode: 403,
                code: ERROR_CODES.AUTH_007,
            });
        });

        it("should throw DATA_001 when tree scan does not exist", async () => {
            mockPrisma.treeScan.findUnique.mockResolvedValue(null);

            await expect(
                service.getTreeScanById(999, adminUser),
            ).rejects.toMatchObject({
                statusCode: 404,
                code: ERROR_CODES.DATA_001,
                message: "Tree scan not found",
            });
        });
    });

    // Tests for creating a tree scan.
    describe("createTreeScan", () => {
        beforeEach(() => {
            mockPrisma.project.findUnique.mockResolvedValue({
                id: 1,
                isActive: true,
            });

            mockPrisma.user.findUnique
                .mockResolvedValueOnce({
                    id: 2,
                    accountActive: true,
                })
                .mockResolvedValueOnce({
                    id: 4,
                    accountActive: true,
                });

            mockPrisma.userProject.findUnique
                .mockResolvedValueOnce({
                    userId: 2,
                    projectId: 1,
                })
                .mockResolvedValueOnce({
                    userId: 4,
                    projectId: 1,
                });

            mockPrisma.treeType.findUnique.mockResolvedValue({
                id: 3,
            });

            mockPrisma.projectTreeType.findUnique.mockResolvedValue({
                projectId: 1,
                treeTypeId: 3,
            });

            mockPrisma.treeScan.create.mockResolvedValue(treeScanRecord);
        });

        it("should create a tree scan successfully with valid input", async () => {
            const result = await service.createTreeScan(validCreateInput);

            expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                select: { id: true, isActive: true },
            });

            expect(mockPrisma.treeScan.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        fobId: "FOB-001",
                        projectId: 1,
                        farmerId: 2,
                        inspectorId: 4,
                        speciesId: 3,
                        estimatedPlantedYear: 2020,
                        estimatedPlantedMonth: 6,
                    }),
                }),
            );

            expect(result).toEqual(treeScanRecord);
        });

        it("should throw DATA_001 when project does not exist", async () => {
            mockPrisma.project.findUnique.mockResolvedValue(null);

            await expect(service.createTreeScan(validCreateInput)).rejects.toMatchObject({
                statusCode: 404,
                code: ERROR_CODES.DATA_001,
                message: "Project not found",
            });
        });

        it("should throw VAL_002 when project is inactive", async () => {
            mockPrisma.project.findUnique.mockResolvedValue({
                id: 1,
                isActive: false,
            });

            await expect(service.createTreeScan(validCreateInput)).rejects.toMatchObject({
                statusCode: 400,
                code: ERROR_CODES.VAL_002,
                message: "Project is inactive",
            });
        });

        it("should throw DATA_001 when farmer does not exist", async () => {
            mockPrisma.user.findUnique.mockReset();
            mockPrisma.user.findUnique.mockResolvedValueOnce(null);

            await expect(service.createTreeScan(validCreateInput)).rejects.toMatchObject({
                statusCode: 404,
                code: ERROR_CODES.DATA_001,
                message: "Farmer not found",
            });
        });

        it("should throw DATA_001 when inspector does not exist", async () => {
            mockPrisma.user.findUnique.mockReset();
            mockPrisma.user.findUnique
                .mockResolvedValueOnce({
                    id: 2,
                    accountActive: true,
                })
                .mockResolvedValueOnce(null);

            await expect(service.createTreeScan(validCreateInput)).rejects.toMatchObject({
                statusCode: 404,
                code: ERROR_CODES.DATA_001,
                message: "Inspector not found",
            });
        });

        it("should throw VAL_002 when user account is inactive", async () => {
            mockPrisma.user.findUnique.mockReset();
            mockPrisma.user.findUnique.mockResolvedValueOnce({
                id: 2,
                accountActive: false,
            });

            await expect(service.createTreeScan(validCreateInput)).rejects.toMatchObject({
                statusCode: 400,
                code: ERROR_CODES.VAL_002,
                message: "User account is inactive",
            });
        });

        it("should throw AUTH_007 when farmer is not assigned to project", async () => {
            mockPrisma.userProject.findUnique.mockReset();
            mockPrisma.userProject.findUnique.mockResolvedValueOnce(null);

            await expect(service.createTreeScan(validCreateInput)).rejects.toMatchObject({
                statusCode: 403,
                code: ERROR_CODES.AUTH_007,
                message: "Farmer is not assigned to this project",
            });
        });

        it("should throw AUTH_007 when inspector is not assigned to project", async () => {
            mockPrisma.userProject.findUnique.mockReset();
            mockPrisma.userProject.findUnique
                .mockResolvedValueOnce({
                    userId: 2,
                    projectId: 1,
                })
                .mockResolvedValueOnce(null);

            await expect(service.createTreeScan(validCreateInput)).rejects.toMatchObject({
                statusCode: 403,
                code: ERROR_CODES.AUTH_007,
                message: "Inspector is not assigned to this project",
            });
        });

        it("should throw DATA_001 when species does not exist", async () => {
            mockPrisma.treeType.findUnique.mockResolvedValue(null);

            await expect(service.createTreeScan(validCreateInput)).rejects.toMatchObject({
                statusCode: 404,
                code: ERROR_CODES.DATA_001,
                message: "Tree type not found",
            });
        });

        it("should throw VAL_002 when species is not assigned to project", async () => {
            mockPrisma.projectTreeType.findUnique.mockResolvedValue(null);

            await expect(service.createTreeScan(validCreateInput)).rejects.toMatchObject({
                statusCode: 400,
                code: ERROR_CODES.VAL_002,
                message: "Tree type is not assigned to this project",
            });
        });

        it("should throw SYS_002 when create fails unexpectedly", async () => {
            mockPrisma.treeScan.create.mockRejectedValue(new Error("DB failure"));

            await expect(service.createTreeScan(validCreateInput)).rejects.toMatchObject({
                statusCode: 500,
                code: ERROR_CODES.SYS_002,
            });
        });
    });

    // Tests for updating a tree scan.
    describe("updateTreeScan", () => {
        const updateInput = {
            heightM: 4.1,
            circumferenceCm: 22,
            correctionReason: "Measurement corrected after verification",
            validationNotes: "Updated after inspection",
        };

        beforeEach(() => {
            mockPrisma.treeScan.findUnique.mockResolvedValue(treeScanRecord);

            mockPrisma.treeScan.update.mockResolvedValue({
                ...treeScanRecord,
                ...updateInput,
                isCorrected: true,
                correctedBy: 1,
            });

            mockPrisma.treeScanAudit.create.mockResolvedValue({
                id: 1,
                treeScanId: 1,
                changedBy: 1,
                changeReason: updateInput.correctionReason,
                oldData: treeScanRecord,
                newData: {
                    ...treeScanRecord,
                    ...updateInput,
                    isCorrected: true,
                    correctedBy: 1,
                },
            });
        });

        it("should update a tree scan and create audit log", async () => {
            const result = await service.updateTreeScan(1, updateInput, adminUser);

            expect(mockPrisma.$transaction).toHaveBeenCalled();

            expect(mockPrisma.treeScan.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 1 },
                    data: expect.objectContaining({
                        heightM: 4.1,
                        circumferenceCm: 22,
                        isCorrected: true,
                        correctionReason: "Measurement corrected after verification",
                        correctedBy: 1,
                    }),
                }),
            );

            expect(mockPrisma.treeScanAudit.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        treeScanId: 1,
                        changedBy: 1,
                        changeReason: "Measurement corrected after verification",
                    }),
                }),
            );

            expect(result).toEqual({
                ...treeScanRecord,
                ...updateInput,
                isCorrected: true,
                correctedBy: 1,
            });
        });

        it("should throw AUTH_004 when inspector tries to update a tree scan", async () => {
            await expect(
                service.updateTreeScan(1, updateInput, inspectorUser),
            ).rejects.toMatchObject({
                statusCode: 403,
                code: ERROR_CODES.AUTH_004,
            });
        });

        it("should throw DATA_001 when tree scan does not exist", async () => {
            mockPrisma.treeScan.findUnique.mockResolvedValue(null);

            await expect(
                service.updateTreeScan(999, updateInput, adminUser),
            ).rejects.toMatchObject({
                statusCode: 404,
                code: ERROR_CODES.DATA_001,
                message: "Tree scan not found",
            });
        });

        it("should revalidate project/farmer/inspector/species when relational fields change", async () => {
            mockPrisma.project.findUnique.mockResolvedValue({
                id: 2,
                isActive: true,
            });

            mockPrisma.user.findUnique
                .mockResolvedValueOnce({
                    id: 5,
                    accountActive: true,
                })
                .mockResolvedValueOnce({
                    id: 6,
                    accountActive: true,
                });

            mockPrisma.userProject.findUnique
                .mockResolvedValueOnce({
                    userId: 5,
                    projectId: 2,
                })
                .mockResolvedValueOnce({
                    userId: 6,
                    projectId: 2,
                });

            mockPrisma.treeType.findUnique.mockResolvedValue({
                id: 7,
            });

            mockPrisma.projectTreeType.findUnique.mockResolvedValue({
                projectId: 2,
                treeTypeId: 7,
            });

            await service.updateTreeScan(
                1,
                {
                    projectId: 2,
                    farmerId: 5,
                    inspectorId: 6,
                    speciesId: 7,
                    correctionReason: "Relational fields corrected",
                },
                adminUser,
            );

            expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
                where: { id: 2 },
                select: { id: true, isActive: true },
            });

            expect(mockPrisma.projectTreeType.findUnique).toHaveBeenCalledWith({
                where: {
                    projectId_treeTypeId: {
                        projectId: 2,
                        treeTypeId: 7,
                    },
                },
            });
        });

        it("should throw SYS_002 when update fails unexpectedly", async () => {
            mockPrisma.treeScan.update.mockRejectedValue(new Error("DB failure"));

            await expect(
                service.updateTreeScan(1, updateInput, adminUser),
            ).rejects.toMatchObject({
                statusCode: 500,
                code: ERROR_CODES.SYS_002,
            });
        });
    });

    // Tests for deleting a tree scan.
    describe("deleteTreeScan", () => {
        it("should archive a tree scan successfully", async () => {
            mockPrisma.treeScan.findUnique.mockResolvedValue(treeScanRecord);
            mockPrisma.treeScan.update.mockResolvedValue({
                ...treeScanRecord,
                isArchived: true,
            });

            const result = await service.deleteTreeScan(1);

            expect(mockPrisma.treeScan.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    isArchived: true,
                },
            });

            expect(result).toEqual({
                message: "Tree scan archived successfully",
            });
        });

        it("should throw DATA_001 when tree scan does not exist", async () => {
            mockPrisma.treeScan.findUnique.mockResolvedValue(null);

            await expect(service.deleteTreeScan(999)).rejects.toMatchObject({
                statusCode: 404,
                code: ERROR_CODES.DATA_001,
                message: "Tree scan not found",
            });
        });
    });

    // Tests for recycling FOB scans.
    describe("recycleFob", () => {
        it("should archive all active scans linked to a FOB ID", async () => {
            mockPrisma.treeScan.updateMany.mockResolvedValue({
                count: 3,
            });

            const result = await service.recycleFob("FOB-001");

            expect(mockPrisma.treeScan.updateMany).toHaveBeenCalledWith({
                where: {
                    fobId: "FOB-001",
                    isArchived: false,
                },
                data: {
                    isArchived: true,
                },
            });

            expect(result).toEqual({
                message: "FOB recycled successfully",
                archivedCount: 3,
            });
        });

        it("should throw VAL_003 when FOB ID is empty", async () => {
            await expect(service.recycleFob("")).rejects.toMatchObject({
                statusCode: 400,
                code: ERROR_CODES.VAL_003,
                message: "FOB ID is required",
            });
        });

        it("should throw SYS_002 when recycle fails unexpectedly", async () => {
            mockPrisma.treeScan.updateMany.mockRejectedValue(new Error("DB failure"));

            await expect(service.recycleFob("FOB-001")).rejects.toMatchObject({
                statusCode: 500,
                code: ERROR_CODES.SYS_002,
            });
        });
    });
});