/**
 * @swagger
 * tags:
 *   - name: Tree Types
 *     description: Master tree type reference data
 * components:
 *   schemas:
 *     TreeType:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: Eucalyptus
 *         key:
 *           type: string
 *           nullable: true
 *           example: eucalyptus
 *         scientific_name:
 *           type: string
 *           nullable: true
 *           example: Eucalyptus globulus
 *         dry_weight_density:
 *           type: number
 *           example: 650
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: 2026-01-28T10:00:00.000Z
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: 2026-01-28T10:00:00.000Z
 *     CreateTreeTypeInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: Eucalyptus
 *         key:
 *           type: string
 *           example: eucalyptus
 *         scientific_name:
 *           type: string
 *           example: Eucalyptus globulus
 *         dry_weight_density:
 *           type: number
 *           example: 650
 *     UpdateTreeTypeInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Updated Eucalyptus
 *         key:
 *           type: string
 *           example: eucalyptus-updated
 *         scientific_name:
 *           type: string
 *           example: Eucalyptus globulus
 *         dry_weight_density:
 *           type: number
 *           example: 640.5
 */

/**
 * @swagger
 * /tree-types:
 *   get:
 *     summary: List tree types
 *     description: Returns all tree types. Authenticated access for all roles.
 *     tags: [Tree Types]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tree types fetched successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /tree-types/{id}:
 *   get:
 *     summary: Get tree type details
 *     description: Returns a single tree type by id. Authenticated access for all roles.
 *     tags: [Tree Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tree type fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tree type not found
 */

/**
 * @swagger
 * /tree-types:
 *   post:
 *     summary: Create tree type
 *     description: Creates a new tree type. Admin only.
 *     tags: [Tree Types]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTreeTypeInput'
 *           example:
 *             name: Eucalyptus
 *             key: eucalyptus
 *             scientific_name: Eucalyptus globulus
 *             dry_weight_density: 650
 *     responses:
 *       201:
 *         description: Tree type created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Duplicate key conflict
 */

/**
 * @swagger
 * /tree-types/{id}:
 *   put:
 *     summary: Update tree type
 *     description: Updates a tree type. Admin only.
 *     tags: [Tree Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTreeTypeInput'
 *           example:
 *             dry_weight_density: 640.5
 *     responses:
 *       200:
 *         description: Tree type updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Tree type not found
 *       409:
 *         description: Duplicate key conflict
 */

/**
 * @swagger
 * /tree-types/{id}:
 *   delete:
 *     summary: Delete tree type
 *     description: Deletes a tree type if it is not referenced. Admin only.
 *     tags: [Tree Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tree type deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Tree type not found
 *       409:
 *         description: Tree type is referenced by other records
 */

export {};
