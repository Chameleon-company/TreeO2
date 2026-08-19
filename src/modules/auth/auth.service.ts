import { randomBytes, createHash } from "crypto";
import { AppError } from "../../middleware/errorHandler";
import { customError } from "../../utils/errorCodes";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { hashPassword } from "../../lib/bcrypt";
import type {
	ForgotPasswordRequestBody,
	JwtPayload,
	LoginRequestBody,
	ResetPasswordRequestBody,
} from "./auth.types";
import { AuthRepository } from "./auth.repository";

export class AuthService {
	constructor(private readonly authRepository = new AuthRepository()) {}

	async login(_payload: LoginRequestBody): Promise<never> {
		await this.ensureAuthReadiness();
		throw new AppError(501, customError("AUTH_006"));
	}

	async logout(_user: JwtPayload): Promise<never> {
		await this.ensureAuthReadiness();
		throw new AppError(501, customError("AUTH_006"));
	}

	async forgotPassword(payload: ForgotPasswordRequestBody): Promise<void> {
		const user = await this.authRepository.findUserByEmail(payload.email);

		// Same response whether or not the email exists, so we don't leak account existence
		if (!user) {
			return;
		}

		const rawToken = randomBytes(32).toString("hex");
		const tokenHash = this.hashToken(rawToken);
		const expiresAt = new Date(
			Date.now() + env.RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000,
		);

		// TODO: Task AUTH08 - Migrate this legacy column write to the new refresh_tokens table structure.
		await this.authRepository.setResetToken(user.id, tokenHash, expiresAt);

		// TODO: send rawToken via a real email provider instead of logging it (tracked in team handover docs, not a repo ticket)
		logger.info("Password reset token generated", {
			userId: user.id,
			resetToken: rawToken,
			expiresAt,
		});
	}

	async resetPassword(payload: ResetPasswordRequestBody): Promise<void> {
		const tokenHash = this.hashToken(payload.token);
		const user = await this.authRepository.findUserByResetTokenHash(tokenHash);

		if (!user) {
			throw new AppError(400, customError("AUTH_005"));
		}

		if (!user.resetTokenExpires || user.resetTokenExpires < new Date()) {
			throw new AppError(400, customError("AUTH_002"));
		}

		const passwordHash = await hashPassword(payload.password);

		await this.authRepository.updatePasswordAndClearResetToken(
			user.id,
			passwordHash,
		);

		// TODO: Task AUTH08 - Revoke refresh tokens on password reset
	}

	async getMe(_user: JwtPayload): Promise<never> {
		await this.ensureAuthReadiness();
		throw new AppError(501, customError("AUTH_006"));
	}

	private hashToken(rawToken: string): string {
		return createHash("sha256").update(rawToken).digest("hex");
	}

	private async ensureAuthReadiness(): Promise<void> {
		await Promise.resolve(this.authRepository.getRoleModelAvailability());
	}
}
