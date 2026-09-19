const fs = require('fs');

const testPath = 'tests/unit/auth.test.ts';
let tests = fs.readFileSync(testPath, 'utf8');

const loginTests = `
    describe("login", () => {
        it("throws 401 AUTH_001 if user does not exist", async () => {
            (authRepository.findUserWithRolesByEmail as jest.Mock).mockResolvedValue(null);
            await expect(authService.login({ email: "test@tree.com", password: "pw" })).rejects.toMatchObject({ statusCode: 401, errorCode: "AUTH_001" });
        });

        it("throws 401 AUTH_001 if password fails bcrypt compare", async () => {
            (authRepository.findUserWithRolesByEmail as jest.Mock).mockResolvedValue({ accountActive: true, canSignIn: true, passwordHash: "hash" });
            const bcrypt = require("bcryptjs");
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);
            await expect(authService.login({ email: "test@tree.com", password: "wrong" })).rejects.toMatchObject({ statusCode: 401, errorCode: "AUTH_001" });
        });

        it("issues Identity JWT and Refresh Token on valid login", async () => {
            const mockUser = {
                id: 1,
                accountActive: true,
                canSignIn: true,
                passwordHash: "hash",
                primaryRole: { name: "FARMER" },
                systemRole: { name: "SystemAdmin" },
                userOrganisations: [{ organisationId: 10, roles: [{ role: { name: "Member" } }] }]
            };
            (authRepository.findUserWithRolesByEmail as jest.Mock).mockResolvedValue(mockUser);
            const bcrypt = require("bcryptjs");
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            // Mock prisma create
            const createMock = jest.fn().mockResolvedValue({});
            (authRepository.getPrismaClient as jest.Mock).mockReturnValue({ refreshToken: { create: createMock } });

            const result = await authService.login({ email: "test@tree.com", password: "pw" });
            
            expect(result).toHaveProperty("accessToken");
            expect(result).toHaveProperty("refreshToken");
            expect(createMock).toHaveBeenCalled();
        });
    });

    describe("refresh", () => {
        it("throws 401 AUTH_002 if token is revoked", async () => {
            const findMock = jest.fn().mockResolvedValue({ revoked: true, expiresAt: new Date(Date.now() + 10000) });
            (authRepository.getPrismaClient as jest.Mock).mockReturnValue({ refreshToken: { findFirst: findMock } });

            await expect(authService.refresh("some-token")).rejects.toMatchObject({ statusCode: 401, errorCode: "AUTH_002" });
        });

        it("revokes old token and issues new ones on valid refresh", async () => {
            const findMock = jest.fn().mockResolvedValue({ id: 99, userId: 1, revoked: false, expiresAt: new Date(Date.now() + 10000) });
            const updateMock = jest.fn().mockResolvedValue({});
            const createMock = jest.fn().mockResolvedValue({});
            
            (authRepository.getPrismaClient as jest.Mock).mockReturnValue({ 
                refreshToken: { findFirst: findMock, update: updateMock, create: createMock } 
            });

            const mockUser = {
                id: 1, accountActive: true, canSignIn: true,
                primaryRole: { name: "FARMER" }, systemRole: { name: "SystemAdmin" },
                userOrganisations: []
            };
            (authRepository.findUserWithRolesById as jest.Mock).mockResolvedValue(mockUser);

            const result = await authService.refresh("valid-token");
            
            expect(result).toHaveProperty("accessToken");
            expect(result).toHaveProperty("refreshToken");
            expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ revoked: true }) }));
            expect(createMock).toHaveBeenCalled();
        });
    });
`;

if (!tests.includes('describe("login"')) {
    tests = tests.replace('describe("forgotPassword", () => {', loginTests + '\n    describe("forgotPassword", () => {');
    // Also mock bcrypt since it's used directly
    tests = `jest.mock("bcryptjs", () => ({ compare: jest.fn() }));\n` + tests;
    
    // Add missing mocks to the repo
    const mockRepoReplacement = `findUserWithRolesByEmail: jest.fn(),\n\tfindUserWithRolesById: jest.fn(),\n\tgetPrismaClient: jest.fn(),\n\t`;
    tests = tests.replace('findUserByEmail: jest.fn(),', mockRepoReplacement + 'findUserByEmail: jest.fn(),');
    
    fs.writeFileSync(testPath, tests);
}
console.log('Injected unit tests.');
