/**
 * @swagger
 * tags:
 *   - name: User Organisation Roles
 *     description: User-organisation role assignment management
 * components:
 *   schemas:
 *     UserOrganisationRole:
 *       type: object
 *       properties:
 *         userId:
 *           type: integer
 *           example: 1
 *         organisationId:
 *           type: integer
 *           example: 2
 *         roleId:
 *           type: integer
 *           example: 3
 *     CreateUserOrganisationRoleInput:
 *       type: object
 *       required:
 *         - userId
 *         - organisationId
 *         - roleId
 *       properties:
 *         userId:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *         organisationId:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         roleId:
 *           type: integer
 *           minimum: 1
 *           example: 3
 *           description: Must reference an existing organisation role
 */

/**
 * @swagger
 * /user-organisation-roles:
 *   post:
 *     summary: Assign a role to a user within an organisation
 *     description: Creates a role assignment for a user in a specific organisation. Validates that the user-organisation membership and the organisation role both exist.
 *     tags: [User Organisation Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserOrganisationRoleInput'
 *           example:
 *             userId: 1
 *             organisationId: 2
 *             roleId: 3
 *     responses:
 *       201:
 *         description: User organisation role assignment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserOrganisationRole'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User organisation membership or organisation role not found
 *       409:
 *         description: Duplicate role assignment (composite primary key violation)
 *       500:
 *         description: System error
 */

/**
 * @swagger
 * /user-organisation-roles/{userId}/{organisationId}/{roleId}:
 *   delete:
 *     summary: Remove a role assignment from a user within an organisation
 *     description: Deletes a specific role assignment for a user in an organisation.
 *     tags: [User Organisation Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *       - in: path
 *         name: organisationId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 2
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 3
 *     responses:
 *       200:
 *         description: User organisation role assignment removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                       example: 1
 *                     organisationId:
 *                       type: integer
 *                       example: 2
 *                     roleId:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User organisation role assignment not found
 *       500:
 *         description: System error
 */

export {};
