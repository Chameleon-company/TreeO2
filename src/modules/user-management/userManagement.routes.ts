import { Router } from 'express';
import { UserManagementController } from './userManagement.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: User Management
 *   description: User management APIs
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  '/',
  authMiddleware,
  async (req: any, res, next) => {
    console.log('➡️ GET /users HIT');
    try {
      await UserManagementController.getUsers(req, res);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.get(
  '/:id',
  authMiddleware,
  async (req: any, res, next) => {
    console.log('➡️ GET /users/:id HIT');
    try {
      await UserManagementController.getUserById(req, res);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create user (Admin only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *             required:
 *               - name
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
  '/',
  (req, res, next) => {
    console.log('➡️ POST /users HIT');
    console.log('Body:', req.body);
    next();
  },
  authMiddleware,
  roleMiddleware(['ADMIN']),
  async (req: any, res, next) => {
    console.log('🚀 CREATE USER START');
    try {
      await UserManagementController.createUser(req, res);
      console.log('🎉 USER CREATED');
    } catch (err) {
      console.error('❌ CREATE USER ERROR:', err);
      next(err);
    }
  }
);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user (Admin only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  async (req, res, next) => {
    try {
      await UserManagementController.updateUser(req, res);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  async (req, res, next) => {
    try {
      await UserManagementController.deleteUser(req, res);
    } catch (err) {
      next(err);
    }
  }
);

export default router;