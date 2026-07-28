import type { Request, Response, NextFunction } from 'express';
import { projectScopeMiddleware } from '../../../src/middleware/projectScope.middleware';
import { AppError } from '../../../src/middleware/errorHandler';
import { ERROR_CODES } from '../../../src/utils/errorCodes';
import type { IdentityJwtPayload, ProjectJwtPayload } from '../../../src/modules/auth/auth.types';

describe('projectScopeMiddleware - Comprehensive Unit Tests', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {};
    next = jest.fn();
  });

  it('should attach req.projectScope and call next() for a valid Project-Scoped token', () => {
    const projectUser: ProjectJwtPayload = {
      sub: '123',
      userId: 123,
      scope: 'project',
      projectId: 45,
      systemRole: null,
      organisationId: 10,
      organisationRole: 'Member',
      projectRoles: ['Manager'],
    };

    req.user = projectUser;

    projectScopeMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(req.projectScope).toEqual({ projectId: 45 });
  });

  it('should reject Identity-Scoped tokens with 403 (AUTH_004)', () => {
    const identityUser: IdentityJwtPayload = {
      sub: '123',
      userId: 123,
      scope: 'identity',
      systemRole: 'SystemAdmin',
    };

    req.user = identityUser;

    projectScopeMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next.mock.calls[0][0] as unknown) as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe(ERROR_CODES.AUTH_004);
    expect(err.code).toBe('AUTH_004');
  });

  it('should reject unauthenticated requests (req.user undefined) with 401 (AUTH_003)', () => {
    req.user = undefined;

    projectScopeMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next.mock.calls[0][0] as unknown) as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe(ERROR_CODES.AUTH_003);
    expect(err.code).toBe('AUTH_003');
  });

  it('should reject tokens with missing or non-positive projectId with 403 (AUTH_004)', () => {
    const invalidProjectUser = {
      sub: '123',
      userId: 123,
      scope: 'project' as const,
      projectId: 0,
      organisationId: 10,
      organisationRole: 'Member',
      projectRoles: ['Inspector'],
    };

    req.user = invalidProjectUser;

    projectScopeMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next.mock.calls[0][0] as unknown) as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe(ERROR_CODES.AUTH_004);
    expect(err.code).toBe('AUTH_004');
  });

  it('should ignore client x-project-id HTTP header and strictly use token claims', () => {
    const identityUser: IdentityJwtPayload = {
      sub: '123',
      userId: 123,
      scope: 'identity',
    };

    req.user = identityUser;
    req.headers = { 'x-project-id': '999' };

    projectScopeMiddleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next.mock.calls[0][0] as unknown) as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(req.projectScope).toBeUndefined();
  });
});
