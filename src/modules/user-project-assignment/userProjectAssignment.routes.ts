import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { userProjectAssignmentController } from "./userProjectAssignment.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: User Project Assignments
 *     description: Endpoints for assigning users to projects
 */

/**
 * @swagger
 * /user-projects:
 *   get:
 *     summary: Retrieve user-project assignments
 *     tags: [User Project Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assignments retrieved successfully
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
    void userProjectAssignmentController.getAssignments(req, res, next);
  },
);

/**
 * @swagger
 * /user-projects:
 *   post:
 *     summary: Assign a user to a project
 *     tags: [User Project Assignments]
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
 *             properties:
 *               userId:
 *                 type: integer
 *               projectId:
 *                 type: integer
 *           example:
 *             userId: 1
 *             projectId: 10
 *     responses:
 *       201:
 *         description: User assigned to project successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User or project not found
 *       409:
 *         description: Assignment already exists
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  (req, res, next) => {
    void userProjectAssignmentController.assignUserToProject(req, res, next);
  },
);

/**
 * @swagger
 * /user-projects/{user_id}/{project_id}:
 *   delete:
 *     summary: Remove a user from a project
 *     tags: [User Project Assignments]
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
 *     responses:
 *       200:
 *         description: Assignment removed successfully
 *       400:
 *         description: Invalid user or project ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Assignment not found
 */
router.delete(
  "/:user_id/:project_id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  (req, res, next) => {
    void userProjectAssignmentController.removeUserFromProject(req, res, next);
  },
);

export default router;
