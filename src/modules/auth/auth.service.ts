import { hashPassword } from "../../lib/bcrypt"; 
import { AppError } from "../../middleware/errorHandler";
import { ERROR_CODES } from "../../utils/errorCodes";
import type {
  ForgotPasswordRequestBody,
  JwtPayload,
  LoginRequestBody,
  RegisterRequestBody,
  RegisterResponse,
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

  async register(payload: RegisterRequestBody): Promise<RegisterResponse> {
    // 1. Check duplicate email
    const existing = await this.authRepository.findUserByEmail(payload.email);
    if (existing) {
      throw new AppError(409, ERROR_CODES.DATA_002, "DATA_002");
    }

    // 2. Find role ID from role name
    const role = await this.authRepository.findRoleByName(payload.role);
    if (!role) {
      throw new AppError(400, ERROR_CODES.VAL_001, "VAL_001");
    }

    // 3. Hash password
    const passwordHash = await hashPassword(payload.password);

    // 4. Create user
    const user = await this.authRepository.createUser({
      name: payload.name,
      email: payload.email,
      passwordHash,
      roleId: role.id,
    });

    // 5. Return safe response
    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email ?? "",
        role: payload.role,
      },
    };
  }

  private async ensureAuthReadiness(): Promise<void> {
    await Promise.resolve(this.authRepository.getRoleModelAvailability());
  }
}
