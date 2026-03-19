import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtPayload } from '../common/interfaces/auth.interface';

const jwtSignOptions: SignOptions = {
  expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  issuer: env.JWT_ISSUER,
  audience: env.JWT_AUDIENCE,
};

export const signAccessToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, jwtSignOptions);

export const verifyAccessToken = (token: string): JwtPayload =>
  jwt.verify(token, env.JWT_SECRET, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  }) as JwtPayload;
