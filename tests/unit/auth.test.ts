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
		setResetToken: jest.Mock;
		findUserByResetTokenHash: jest.Mock;
		updatePasswordAndClearResetToken: jest.Mock;
	};
	let service: AuthService;

	beforeEach(() => {
		jest.clearAllMocks();
		mockRepo = {
			findUserByEmail: jest.fn(),
			setResetToken: jest.fn(),
			findUserByResetTokenHash: jest.fn(),
			updatePasswordAndClearResetToken: jest.fn(),
		};
		service = new AuthService(mockRepo as unknown as AuthRepository);
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
