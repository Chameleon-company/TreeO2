/**
 * @swagger
 * tags:
 *   - name: Project Organisations
 *     description: Project organisation sharing management
 * components:
 *   schemas:
 *     ProjectOrganisation:
 *       type: object
 *       properties:
 *         projectId:
 *           type: integer
 *           example: 1
 *         organisationId:
 *           type: integer
 *           example: 2
 *         accessType:
 *           type: string
 *           enum: [shared, owner, partner]
 *           example: shared
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2024-01-15T10:30:00.000Z
 *     CreateProjectOrganisationInput:
 *       type: object
 *       required:
 *         - projectId
 *         - organisationId
 *       properties:
 *         projectId:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *         organisationId:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         accessType:
 *           type: string
 *           enum: [shared, owner, partner]
 *           description: Cannot be "owner". Defaults to "shared".
 *           example: shared
 */

/**
 * @swagger
 * /project-organisations:
 *   get:
 *     summary: List all project-organisation sharing links
 *     description: Returns all project-organisation relationships.
 *     tags: [Project Organisations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project organisations fetched successfully
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
 *                     $ref: '#/components/schemas/ProjectOrganisation'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: System error
 */

/**
 * @swagger
 * /project-organisations:
 *   post:
 *     summary: Create a project-organisation sharing link
 *     description: Creates a sharing link between a project and an organisation. Access type cannot be "owner".
 *     tags: [Project Organisations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProjectOrganisationInput'
 *           example:
 *             projectId: 1
 *             organisationId: 2
 *             accessType: shared
 *     responses:
 *       201:
 *         description: Project organisation sharing link created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ProjectOrganisation'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project or organisation not found
 *       409:
 *         description: Duplicate project-organisation relationship
 *       422:
 *         description: Access type cannot be "owner"
 *       500:
 *         description: System error
 */

/**
 * @swagger
 * /project-organisations/{projectId}/{organisationId}:
 *   delete:
 *     summary: Remove a project-organisation sharing link
 *     description: Deletes a project-organisation sharing link. Cannot remove "owner" access type.
 *     tags: [Project Organisations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
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
 *         description: Project organisation sharing link removed successfully
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
 *                     message:
 *                       type: string
 *                       example: Project organisation sharing removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project-organisation sharing link not found
 *       422:
 *         description: Cannot remove "owner" access type
 *       500:
 *         description: System error
 */

// TODO: Add proper permission-based auth middleware (see T2-2026 API13)
// TODO: Revoke affected users' refresh tokens on deletion (see T2-2026 API13)

export {};
