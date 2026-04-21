import type { Request, Response } from "express";
import { AppError } from "../../middleware/errorHandler";
import { ERROR_CODES } from "../../utils/errorCodes";
import { AuthService } from "./auth.service";
import type {
  ForgotPasswordRequestBody,
  JwtPayload,
  LoginRequestBody,
  ResetPasswordRequestBody,
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

  async forgotPassword(req: Request, res: Response): Promise<void> {
    await this.authService.forgotPassword(
      req.body as ForgotPasswordRequestBody,
    );
    res.status(501).json({ success: false, message: "Not implemented" });
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    await this.authService.resetPassword(req.body as ResetPasswordRequestBody);
    res.status(501).json({ success: false, message: "Not implemented" });
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
      throw new AppError(401, ERROR_CODES.AUTH_003, "AUTH_003");
    }

    return req.user;
  }
}
