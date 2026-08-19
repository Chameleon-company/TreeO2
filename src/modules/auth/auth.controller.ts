import type { Request, Response } from "express";
import { AppError } from "../../middleware/errorHandler";
import { customError } from "../../utils/errorCodes";
import { AuthService } from "./auth.service";
import type {
	ForgotPasswordRequest,
	JwtPayload,
	LoginRequestBody,
	ResetPasswordRequest,
} from "./auth.types";

export class AuthController {
	constructor(private readonly authService = new AuthService()) {}

	async login(req: Request, res: Response): Promise<void> {
		await this.authService.login(req.body as LoginRequestBody);
		res.status(501).json({ success: false, message: "Not implemented" });
	}

	async logout(req: Request, res: Response): Promise<void> {
		await this.authService.logout(this.requireUser(req));
		res.status(501).json({ success: false, message: "Not implemented" });
	}

	async forgotPassword(req: ForgotPasswordRequest, res: Response): Promise<void> {
		await this.authService.forgotPassword(req.body);
		res.status(200).json({
			success: true,
			message:
				"If an account with that email exists, a password reset link has been sent",
		});
	}

	async resetPassword(req: ResetPasswordRequest, res: Response): Promise<void> {
		await this.authService.resetPassword(req.body);
		res.status(200).json({
			success: true,
			message: "Password has been reset",
		});
	}

	async me(req: Request, res: Response): Promise<void> {
		await this.authService.getMe(this.requireUser(req));
		res.status(501).json({ success: false, message: "Not implemented" });
	}

	getProtectedTest(req: Request, res: Response): void {
		const user = this.requireUser(req);

		res.status(200).json({
			success: true,
			message: "Protected auth test endpoint reached",
			data: {
				user,
				requestId: req.requestId ?? null,
			},
		});
	}

	getAdminTest(req: Request, res: Response): void {
		const user = this.requireUser(req);

		res.status(200).json({
			success: true,
			message: "Admin auth test endpoint reached",
			data: {
				user,
				requestId: req.requestId ?? null,
			},
		});
	}

	getProjectScopeTest(req: Request, res: Response): void {
		const user = this.requireUser(req);

		res.status(200).json({
			success: true,
			message: "Project scope test endpoint reached",
			data: {
				user,
				projectScope: req.projectScope ?? null,
				requestId: req.requestId ?? null,
			},
		});
	}

	private requireUser(req: Request): JwtPayload {
		if (!req.user) {
			throw new AppError(401, customError("AUTH_003"));
		}

		return req.user;
	}
}
