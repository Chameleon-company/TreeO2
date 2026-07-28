import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../../../src/middleware/auth.middleware';
import { AppError } from '../../../src/middleware/errorHandler';
import { env } from '../../../src/config/env';

describe('authMiddleware - Comprehensive Unit Tests', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;
  const secretKey = (env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production') as string;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {};
    next = jest.fn();
  });

  it('should attach req.user and call next() for a valid signed JWT', () => {
    const payload = {
      sub: '123',
      userId: 123,
      scope: 'project' as const,
      projectId: 45,
      systemRole: null,
      organisationId: 10,
      organisationRole: 'Member',
      projectRoles: ['Manager'],
    };

    const token = jwt.sign(payload, secretKey);
    req.headers = { authorization: `Bearer ${token}` };

    authMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeDefined();
    if (req.user?.scope === 'project') {
      expect(req.user.userId).toBe(123);
      expect(req.user.scope).toBe('project');
    }
  });

  it('should pass AppError(401, AUTH_003) when Authorization header is missing', () => {
    req.headers = {};

    authMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next.mock.calls[0][0] as unknown) as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('AUTH_003');
  });

  it('should pass AppError(401, AUTH_003) when Authorization header is not Bearer format', () => {
    req.headers = { authorization: 'Basic dXNlcjpwYXNz' };

    authMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next.mock.calls[0][0] as unknown) as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('AUTH_003');
  });

  it('should pass AppError(401, AUTH_005) when JWT signature is invalid', () => {
    const token = jwt.sign({ sub: '123', userId: 123, scope: 'identity' }, 'wrong-secret-key-32-chars-long');
    req.headers = { authorization: `Bearer ${token}` };

    authMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next.mock.calls[0][0] as unknown) as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('AUTH_005');
  });

  it('should pass AppError(401, AUTH_005) when JWT token is expired', () => {
    const token = jwt.sign(
      { sub: '123', userId: 123, scope: 'identity' },
      secretKey,
      { expiresIn: '-1s' },
    );
    req.headers = { authorization: `Bearer ${token}` };

    authMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next.mock.calls[0][0] as unknown) as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('AUTH_005');
  });

  describe('Development Bypass Tokens (AUTH_DEV_MODE=true)', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
      (env as { NODE_ENV: string }).NODE_ENV = 'development';
      (env as { AUTH_DEV_MODE: boolean }).AUTH_DEV_MODE = true;
    });

    afterEach(() => {
      (env as { NODE_ENV: string }).NODE_ENV = originalNodeEnv || 'test';
    });

    it('should assign spec-compliant Identity payload for dev-admin-token', () => {
      req.headers = { authorization: `Bearer ${env.AUTH_DEV_ADMIN_TOKEN}` };

      authMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toEqual({
        sub: '1',
        userId: 1,
        scope: 'identity',
        systemRole: 'SystemAdmin',
        role: 'ADMIN',
      });
    });

    it('should assign spec-compliant Project payload for dev-manager-token', () => {
      req.headers = { authorization: `Bearer ${env.AUTH_DEV_MANAGER_TOKEN}` };

      authMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user?.scope).toBe('project');
      if (req.user?.scope === 'project') {
        expect(req.user.projectId).toBe(1);
        expect(req.user.projectRoles).toEqual(['Manager']);
      }
    });

    it('should assign spec-compliant Project payload for dev-inspector-token', () => {
      req.headers = { authorization: `Bearer ${env.AUTH_DEV_INSPECTOR_TOKEN}` };

      authMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user?.scope).toBe('project');
      if (req.user?.scope === 'project') {
        expect(req.user.projectRoles).toEqual(['Inspector']);
      }
    });

    it('should assign spec-compliant Project payload for dev-farmer-token', () => {
      req.headers = { authorization: `Bearer ${env.AUTH_DEV_FARMER_TOKEN}` };

      authMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user?.scope).toBe('project');
      if (req.user?.scope === 'project') {
        expect(req.user.projectRoles).toEqual(['Farmer']);
      }
    });

    it('should assign spec-compliant Project payload for dev-developer-token', () => {
      req.headers = { authorization: `Bearer ${env.AUTH_DEV_DEVELOPER_TOKEN}` };

      authMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user?.scope).toBe('project');
      if (req.user?.scope === 'project') {
        expect(req.user.projectRoles).toEqual(['Developer']);
      }
    });
  });
});
