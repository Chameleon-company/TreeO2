import { randomBytes, createHash } from "crypto";
import { AppError } from "../../middleware/errorHandler";
import { customError } from "../../utils/errorCodes";
import { logger } from "../../config/logger";
import { hashPassword } from "../../lib/bcrypt";
import type {
	ForgotPasswordRequestBody,
	JwtPayload,
	LoginRequestBody,
	ResetPasswordRequestBody,
} from "./auth.types";
import { AuthRepository } from "./auth.repository";

const RESET_TOKEN_EXPIRY_MINUTES = 30;

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
			Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000,
		);

		await this.authRepository.setResetToken(user.id, tokenHash, expiresAt);

		// TODO: Task <email delivery ticket> - send rawToken via a real email provider instead of logging it
		logger.info("Password reset token generated", {
			userId: user.id,
			resetToken: rawToken,
			expiresAt,
		});
	}

	async resetPassword(payload: ResetPasswordRequestBody): Promise<void> {
		const tokenHash = this.hashToken(payload.token);
		const user =
			await this.authRepository.findUserByValidResetTokenHash(tokenHash);

		if (!user) {
			throw new AppError(400, customError("AUTH_005"));
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
