import { AppError } from "../../middleware/errorHandler";
import { ERROR_CODES } from "../../utils/errorCodes";
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
    throw new AppError(501, ERROR_CODES.AUTH_006, "AUTH_006");
  }

  async logout(_user: JwtPayload): Promise<never> {
    await this.ensureAuthReadiness();
    throw new AppError(501, ERROR_CODES.AUTH_006, "AUTH_006");
  }

  async forgotPassword(_payload: ForgotPasswordRequestBody): Promise<never> {
    await this.ensureAuthReadiness();
    throw new AppError(501, ERROR_CODES.AUTH_006, "AUTH_006");
  }

  async resetPassword(_payload: ResetPasswordRequestBody): Promise<never> {
    await this.ensureAuthReadiness();
    throw new AppError(501, ERROR_CODES.AUTH_006, "AUTH_006");
  }

  async getMe(_user: JwtPayload): Promise<never> {
    await this.ensureAuthReadiness();
    throw new AppError(501, ERROR_CODES.AUTH_006, "AUTH_006");
  }

  private async ensureAuthReadiness(): Promise<void> {
    await Promise.resolve(this.authRepository.getRoleModelAvailability());
  }
}
