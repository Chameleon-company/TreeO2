/**
 * @swagger
 * tags:
 *   - name: User Organisation Roles
 *     description: Endpoints for assigning users to roles within organisations
 */

/**
 * @swagger
 * /user-organisation-roles:
 *   post:
 *     summary: Assign a user to an organisation role
 *     tags: [User Organisation Roles]
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
 *               - organisationId
 *               - roleId
 *             properties:
 *               userId:
 *                 type: integer
 *               organisationId:
 *                 type: integer
 *               roleId:
 *                 type: integer
 *           example:
 *             userId: 1
 *             organisationId: 10
 *             roleId: 3
 *     responses:
 *       201:
 *         description: Role assigned successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User or organisation not found
 *       409:
 *         description: Organisation role already exists
 */

/**
 * @swagger
 * /user-organisation-roles/{user_id}/{organisation_id}/{role_id}:
 *   delete:
 *     summary: Remove a user from an organisation
 *     tags: [User Organisation Roles]
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
 *         name: organisation_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organisation ID
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Organisation role removed successfully
 *       400:
 *         description: Invalid user or project ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Organisation role not found
 */

export {};
