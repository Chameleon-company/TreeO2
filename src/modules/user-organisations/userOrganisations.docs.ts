/**
 * @swagger
 * tags:
 *   - name: User Organisation Membership
 *     description: Endpoints for assigning users to organisations
 */

/**
 * @swagger
 * /user-organisations:
 *   get:
 *     summary: List user-organisation memberships
 *     tags: [User Organisation Membership]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Memberships retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /user-organisations:
 *   post:
 *     summary: Add a user to an organisation
 *     tags: [User Organisation Membership]
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
 *             properties:
 *               userId:
 *                 type: integer
 *               organisationId:
 *                 type: integer
 *           example:
 *             userId: 1
 *             organisationId: 10
 *     responses:
 *       201:
 *         description: Organisation membership created successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User or organisation not found
 *       409:
 *         description: Membership already exists
 */

/**
 * @swagger
 * /user-organisations/{user_id}/{organisation_id}:
 *   put:
 *     summary: Update membership status
 *     tags: [User Organisation Membership]
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
 *     responses:
 *       201:
 *         description: Organisation membership created successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User or organisation not found
 *       409:
 *         description: Membership already exists
 */

/**
 * @swagger
 * /user-organisations/{user_id}/{organisation_id}:
 *   delete:
 *     summary: Remove a user from an organisation
 *     tags: [User Organisation Membership]
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
 *     responses:
 *       200:
 *         description: Membership removed successfully
 *       400:
 *         description: Invalid user or project ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Membership not found
 */

export {};
