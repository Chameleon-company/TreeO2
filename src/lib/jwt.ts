import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import type { JwtPayload } from "../modules/auth/auth.types";

export const signJwt = (payload: JwtPayload): string =>
  jwt.sign(payload, env.JWT_SECRET as Secret, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    algorithm: "HS256",
  });

export const verifyJwt = (token: string): JwtPayload =>
  jwt.verify(token, env.JWT_SECRET as Secret, {
    algorithms: ["HS256"],
  }) as JwtPayload;
