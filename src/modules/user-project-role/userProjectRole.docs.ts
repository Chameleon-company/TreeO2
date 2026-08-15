/**
 * @swagger
 * tags:
 *   - name: User Project Roles
 *     description: Manage project role assignments for users
 *
 * components:
 *   schemas:
 *     UserProjectRole:
 *       type: object
 *       properties:
 *         userId:
 *           type: integer
 *           example: 2
 *         projectId:
 *           type: integer
 *           example: 1
 *         roleId:
 *           type: integer
 *           example: 3
 *         assignedBy:
 *           type: integer
 *           example: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     AssignUserProjectRoleInput:
 *       type: object
 *       required:
 *         - userId
 *         - projectId
 *         - roleId
 *       properties:
 *         userId:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         projectId:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *         roleId:
 *           type: integer
 *           minimum: 1
 *           example: 3
 */

/**
 * @swagger
 * /user-project-roles:
 *   get:
 *     summary: List all user project role assignments
 *     description: Returns all user project role assignments.
 *     tags: [User Project Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User project roles fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserProjectRole'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: System error
 */

/**
 * @swagger
 * /user-project-roles:
 *   post:
 *     summary: Assign a project role to a user
 *     description: Assigns a role to a user for a specific project.
 *     tags: [User Project Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignUserProjectRoleInput'
 *           example:
 *             userId: 2
 *             projectId: 1
 *             roleId: 3
 *     responses:
 *       201:
 *         description: User project role assigned successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: User is not eligible for the project
 *       404:
 *         description: User, project, or role not found
 *       409:
 *         description: Role is already assigned
 *       500:
 *         description: System error
 */

/**
 * @swagger
 * /user-project-roles/{user_id}/{project_id}/{role_id}:
 *   delete:
 *     summary: Remove a project role from a user
 *     description: Removes one specific role assigned to a user for a project.
 *     tags: [User Project Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 2
 *       - in: path
 *         name: project_id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 3
 *     responses:
 *       200:
 *         description: User project role removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User project role assignment not found
 *       500:
 *         description: System error
 */

export {};
