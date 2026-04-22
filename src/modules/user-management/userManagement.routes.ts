import { Router } from 'express';
import { UserManagementController } from './userManagement.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserManagementService } from './userManagement.service';
import { signJwt } from '../../lib/jwt';

const router = Router();

/**
 * 🔐 GET USERS
 */
router.get(
  '/users',
  authMiddleware,
  (req, res, next) => {
    void UserManagementController.getUsers(req, res).catch(next);
  }
);

/**
 * 🔐 GET USER BY ID
 */
router.get(
  '/users/:id',
  authMiddleware,
  (req, res, next) => {
    void UserManagementController.getUserById(req, res).catch(next);
  }
);

/**
 * 🔐 CREATE USER (ADMIN ONLY)
 */
router.post(
  '/users',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  (req, res, next) => {
    void UserManagementController.createUser(req, res).catch(next);
  }
);


/**
 * 🔐 UPDATE USER (ADMIN ONLY)
 */
router.put(
  '/users/:id',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  (req, res, next) => {
    void UserManagementController.updateUser(req, res).catch(next);
  }
);

/**
 * 🔐 DELETE USER (ADMIN ONLY)
 */
router.delete(
  '/users/:id',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  (req, res, next) => {
    void UserManagementController.deleteUser(req, res).catch(next);
  }
);

export default router;