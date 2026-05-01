import { Router, Request, Response, NextFunction } from "express";
import { UserManagementController } from "./userManagement.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";

type AsyncFn = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

const asyncHandler =
  (fn: AsyncFn) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };

const router = Router();

/**
 * @swagger
 * tags:
 *   name: User Management
 *   description: User management APIs (RBAC enforced)
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get users (Admin full access, Manager scoped by project)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Roles:
 *       - ADMIN: Can fetch all users
 *       - MANAGER: Can fetch users only within assigned projects
 *     parameters:
 *       - in: query
 *         name: project
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter users by projectId
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: number
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   accountActive:
 *                     type: boolean
 *                   canSignIn:
 *                     type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */

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
 *             required:
 *               - name
 *               - email
 *               - roleId
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               roleId:
 *                 type: number
 *               projectIds:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Email already exists
 */

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user (Admin full access, Manager scoped with restrictions)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Roles:
 *       - ADMIN: Can update all fields
 *       - MANAGER: Can update only allowed fields within assigned projects
 *
 *       Managers CANNOT update:
 *       - roleId
 *       - accountActive
 *       - canSignIn
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               roleId:
 *                 type: number
 *               projectIds:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (role or scope restriction)
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already exists
 */

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Soft delete user (Admin only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  asyncHandler(UserManagementController.getUsers),
);

router.get(
  "/:id",
  authMiddleware,
  asyncHandler(UserManagementController.getUserById),
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  asyncHandler(UserManagementController.createUser),
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  asyncHandler(UserManagementController.updateUser),
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  asyncHandler(UserManagementController.deleteUser),
);

export default router;
