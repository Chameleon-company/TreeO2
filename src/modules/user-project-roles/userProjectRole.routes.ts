import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { userProjectRoleController } from "./userProjectRole.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: User Project Roles
 *     description: Endpoints for managing user roles within projects
 */

/**
 * @swagger
 * /user-project-roles:
 *   get:
 *     summary: Retrieve user project role assignments
 *     tags: [User Project Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User project roles retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  (req, res, next) => {
    void userProjectRoleController.getRoles(req, res, next);
  },
);

/**
 * @swagger
 * /user-project-roles:
 *   post:
 *     summary: Assign a role to a user within a project
 *     tags: [User Project Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - projectId
 *               - roleId
 *               - assignedBy
 *             properties:
 *               userId:
 *                 type: integer
 *               projectId:
 *                 type: integer
 *               roleId:
 *                 type: integer
 *               assignedBy:
 *                 type: integer
 *           example:
 *             userId: 1
 *             projectId: 10
 *             roleId: 2
 *             assignedBy: 4
 *     responses:
 *       201:
 *         description: User project role assigned successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User, project, or role not found
 *       409:
 *         description: Role assignment already exists
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  (req, res, next) => {
    void userProjectRoleController.createUserProjectRole(req, res, next);
  },
);

/**
 * @swagger
 * /user-project-roles/{user_id}/{project_id}/{role_id}:
 *   delete:
 *     summary: Remove a role assignment from a user within a project
 *     tags: [User Project Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: path
 *         name: project_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: User project role removed successfully
 *       400:
 *         description: Invalid user, project, or role ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Role assignment not found
 */
router.delete(
  "/:user_id/:project_id/:role_id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  (req, res, next) => {
    void userProjectRoleController.deleteUserProjectRole(req, res, next);
  },
);

export default router;
