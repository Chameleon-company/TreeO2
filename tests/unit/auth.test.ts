import bcrypt from "bcryptjs";
jest.mock("bcryptjs", () => ({ compare: jest.fn() }));
import { createHash } from "crypto";
import type { User } from "@prisma/client";
import { AuthService } from "../../src/modules/auth/auth.service";
import type { AuthRepository } from "../../src/modules/auth/auth.repository";
import { hashPassword } from "../../src/lib/bcrypt";
import { logger } from "../../src/config/logger";

jest.mock("../../src/lib/bcrypt", () => ({
	hashPassword: jest.fn(),
}));

jest.mock("../../src/config/logger", () => ({
	logger: {
		info: jest.fn(),
		error: jest.fn(),
		warn: jest.fn(),
		debug: jest.fn(),
	},
}));

describe("AuthService", () => {
	let mockRepo: {
		findUserByEmail: jest.Mock;
		findUserWithRolesByEmail: jest.Mock;
		findUserWithRolesById: jest.Mock;
		getPrismaClient: jest.Mock;
		setResetToken: jest.Mock;
		findUserByResetTokenHash: jest.Mock;
		updatePasswordAndClearResetToken: jest.Mock;
	};
	let service: AuthService;

	beforeEach(() => {
		jest.clearAllMocks();
		mockRepo = {
			findUserWithRolesByEmail: jest.fn(),
			findUserWithRolesById: jest.fn(),
			getPrismaClient: jest.fn(),
			findUserByEmail: jest.fn(),
			setResetToken: jest.fn(),
			findUserByResetTokenHash: jest.fn(),
			updatePasswordAndClearResetToken: jest.fn(),
		};
		service = new AuthService(mockRepo as unknown as AuthRepository);
	});

	describe("login", () => {
		it("throws 401 AUTH_001 if user does not exist", async () => {
			mockRepo.findUserWithRolesByEmail.mockResolvedValue(null);
			await expect(
				service.login({ email: "test@tree.com", password: "pw" }),
			).rejects.toMatchObject({ statusCode: 401, code: "AUTH_001" });
		});

		it("throws 401 AUTH_001 if password fails bcrypt compare", async () => {
			mockRepo.findUserWithRolesByEmail.mockResolvedValue({
				accountActive: true,
				canSignIn: true,
				passwordHash: "hash",
			});
			(bcrypt.compare as jest.Mock).mockResolvedValue(false);
			await expect(
				service.login({ email: "test@tree.com", password: "wrong" }),
			).rejects.toMatchObject({ statusCode: 401, code: "AUTH_001" });
		});

		it("issues Identity JWT and Refresh Token on valid login", async () => {
			const mockUser = {
				id: 1,
				accountActive: true,
				canSignIn: true,
				passwordHash: "hash",
				primaryRole: { name: "FARMER" },
				systemRole: { name: "SystemAdmin" },
				userOrganisations: [
					{ organisationId: 10, roles: [{ role: { name: "Member" } }] },
				],
			};
			mockRepo.findUserWithRolesByEmail.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);

			// Mock prisma create
			const createMock = jest.fn().mockResolvedValue({});
			mockRepo.getPrismaClient.mockReturnValue({
				refreshToken: { create: createMock },
			});

			const result = await service.login({
				email: "test@tree.com",
				password: "pw",
			});

			expect(result).toHaveProperty("accessToken");
			expect(result).toHaveProperty("refreshToken");
			expect(createMock).toHaveBeenCalled();
		});
	});

	describe("refresh", () => {
		it("throws 401 AUTH_002 if token is revoked", async () => {
			const findMock = jest.fn().mockResolvedValue({
				revoked: true,
				expiresAt: new Date(Date.now() + 10000),
			});
			mockRepo.getPrismaClient.mockReturnValue({
				refreshToken: { findFirst: findMock },
			});

			await expect(service.refresh("some-token")).rejects.toMatchObject({
				statusCode: 401,
				code: "AUTH_002",
			});
		});

		it("revokes old token and issues new ones on valid refresh", async () => {
			const findMock = jest.fn().mockResolvedValue({
				id: 99,
				userId: 1,
				revoked: false,
				expiresAt: new Date(Date.now() + 10000),
			});
			const updateMock = jest.fn().mockResolvedValue({});
			const createMock = jest.fn().mockResolvedValue({});

			mockRepo.getPrismaClient.mockReturnValue({
				refreshToken: {
					findFirst: findMock,
					update: updateMock,
					create: createMock,
				},
			});

			const mockUser = {
				id: 1,
				accountActive: true,
				canSignIn: true,
				primaryRole: { name: "FARMER" },
				systemRole: { name: "SystemAdmin" },
				userOrganisations: [],
			};
			mockRepo.findUserWithRolesById.mockResolvedValue(mockUser);

			const result = await service.refresh("valid-token");

			expect(result).toHaveProperty("accessToken");
			expect(result).toHaveProperty("refreshToken");
			expect(updateMock).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({ revoked: true }),
				}),
			);
			expect(createMock).toHaveBeenCalled();
		});
	});

	describe("forgotPassword", () => {
		it("does nothing when the email doesn't match a user", async () => {
			mockRepo.findUserByEmail.mockResolvedValue(null);

			await service.forgotPassword({ email: "nobody@example.com" });

			expect(mockRepo.setResetToken).not.toHaveBeenCalled();
		});

		it("generates and stores a hashed token when the user exists", async () => {
			mockRepo.findUserByEmail.mockResolvedValue({ id: 42 } as unknown as User);

			await service.forgotPassword({ email: "user@example.com" });

			expect(mockRepo.findUserByEmail).toHaveBeenCalledWith("user@example.com");
			expect(mockRepo.setResetToken).toHaveBeenCalledTimes(1);
			const [userId, tokenHash, expiresAt] =
				mockRepo.setResetToken.mock.calls[0];
			expect(userId).toBe(42);
			expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
			expect((expiresAt as Date).getTime()).toBeGreaterThan(Date.now());

			// the stored hash must match the raw token that was logged
			const loggedMeta = (logger.info as jest.Mock).mock.calls[0][1];
			const rawToken = loggedMeta.resetToken as string;
			expect(createHash("sha256").update(rawToken).digest("hex")).toBe(
				tokenHash,
			);
		});
	});

	describe("resetPassword", () => {
		it("throws 400 AUTH_005 when the token hash doesn't match any user", async () => {
			mockRepo.findUserByResetTokenHash.mockResolvedValue(null);

			await expect(
				service.resetPassword({
					token: "bad-token",
					password: "newpassword123",
				}),
			).rejects.toMatchObject({ statusCode: 400, code: "AUTH_005" });

			expect(mockRepo.updatePasswordAndClearResetToken).not.toHaveBeenCalled();
		});

		it("throws 400 AUTH_002 when the token has expired", async () => {
			mockRepo.findUserByResetTokenHash.mockResolvedValue({
				id: 7,
				resetTokenExpires: new Date(Date.now() - 60 * 1000),
			} as unknown as User);

			await expect(
				service.resetPassword({
					token: "expired-token",
					password: "newpassword123",
				}),
			).rejects.toMatchObject({ statusCode: 400, code: "AUTH_002" });

			expect(mockRepo.updatePasswordAndClearResetToken).not.toHaveBeenCalled();
		});

		it("hashes the new password and clears the reset token on success", async () => {
			mockRepo.findUserByResetTokenHash.mockResolvedValue({
				id: 7,
				resetTokenExpires: new Date(Date.now() + 60 * 1000),
			} as unknown as User);
			(hashPassword as jest.Mock).mockResolvedValue("hashed-password");

			await service.resetPassword({
				token: "good-token",
				password: "newpassword123",
			});

			expect(hashPassword).toHaveBeenCalledWith("newpassword123");
			expect(mockRepo.updatePasswordAndClearResetToken).toHaveBeenCalledWith(
				7,
				"hashed-password",
			);
		});
	});
});
