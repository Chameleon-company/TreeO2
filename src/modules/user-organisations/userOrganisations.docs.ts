/**
 * @swagger
 * tags:
 *   - name: User Organisations
 *     description: User-organisation membership management
 * components:
 *   schemas:
 *     UserOrganisation:
 *       type: object
 *       properties:
 *         userId:
 *           type: integer
 *           example: 1
 *         organisationId:
 *           type: integer
 *           example: 2
 *         status:
 *           type: string
 *           enum: [invited, active, suspended]
 *           example: active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-15T10:30:00.000Z
 *     CreateUserOrganisationInput:
 *       type: object
 *       required:
 *         - userId
 *         - organisationId
 *       properties:
 *         userId:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *         organisationId:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         status:
 *           type: string
 *           enum: [invited, active, suspended]
 *           description: Defaults to "active".
 *           example: active
 *     UpdateUserOrganisationInput:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [invited, active, suspended]
 *           example: active
 */

/**
 * @swagger
 * /user-organisations:
 *   get:
 *     summary: List all user-organisation memberships (paginated)
 *     description: Returns all user-organisation relationships with pagination.
 *     tags: [User Organisations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: User organisations fetched successfully
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
 *                     $ref: '#/components/schemas/UserOrganisation'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: System error
 */

/**
 * @swagger
 * /user-organisations:
 *   post:
 *     summary: Create a user-organisation membership
 *     description: Creates a membership between a user and an organisation. Validates that both the user and organisation exist.
 *     tags: [User Organisations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserOrganisationInput'
 *           example:
 *             userId: 1
 *             organisationId: 2
 *             status: active
 *     responses:
 *       201:
 *         description: User organisation membership created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserOrganisation'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User or organisation not found
 *       500:
 *         description: System error
 */

/**
 * @swagger
 * /user-organisations/{userId}/{organisationId}:
 *   put:
 *     summary: Update a user-organisation membership
 *     description: Updates the status of an existing user-organisation membership.
 *     tags: [User Organisations]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserOrganisationInput'
 *           example:
 *             status: active
 *     responses:
 *       200:
 *         description: User organisation membership updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserOrganisation'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User organisation membership not found
 *       500:
 *         description: System error
 */

/**
 * @swagger
 * /user-organisations/{userId}/{organisationId}:
 *   delete:
 *     summary: Remove a user-organisation membership
 *     description: Deletes a user-organisation membership and all associated role assignments.
 *     tags: [User Organisations]
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
 *     responses:
 *       200:
 *         description: User organisation membership removed successfully
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User organisation membership not found
 *       500:
 *         description: System error
 */

export {};
