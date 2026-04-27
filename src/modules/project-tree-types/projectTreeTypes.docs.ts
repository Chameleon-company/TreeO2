/**
 * @swagger
 * tags:
 *   - name: Project Tree Types
 *     description: Project to tree type assignment management
 * components:
 *   schemas:
 *     ProjectTreeType:
 *       type: object
 *       properties:
 *         project_id:
 *           type: integer
 *           example: 1
 *         tree_type_id:
 *           type: integer
 *           example: 3
 *         project:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             name:
 *               type: string
 *               example: Northern NSW Reforestation
 *         tree_type:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 3
 *             name:
 *               type: string
 *               example: Mahogany
 *             key:
 *               type: string
 *               nullable: true
 *               example: mahogany
 *             scientific_name:
 *               type: string
 *               nullable: true
 *               example: Swietenia macrophylla
 *             dry_weight_density:
 *               type: number
 *               example: 550
 *     CreateProjectTreeTypeInput:
 *       type: object
 *       required:
 *         - project_id
 *         - tree_type_id
 *       properties:
 *         project_id:
 *           type: integer
 *           example: 1
 *         tree_type_id:
 *           type: integer
 *           example: 3
 */

/**
 * @swagger
 * /project-tree-types:
 *   get:
 *     summary: List project tree type mappings
 *     description: Returns project to tree type assignments. Admin and Manager only.
 *     tags: [Project Tree Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project_id
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Project tree types fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /project-tree-types:
 *   post:
 *     summary: Assign tree type to project
 *     description: Creates a project to tree type assignment. Admin only.
 *     tags: [Project Tree Types]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProjectTreeTypeInput'
 *           example:
 *             project_id: 1
 *             tree_type_id: 3
 *     responses:
 *       201:
 *         description: Tree type assigned to project successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project or tree type not found
 *       409:
 *         description: Duplicate mapping conflict
 */

/**
 * @swagger
 * /project-tree-types/{project_id}/{tree_type_id}:
 *   delete:
 *     summary: Remove tree type from project
 *     description: Deletes a project to tree type assignment. Admin only.
 *     tags: [Project Tree Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: project_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: tree_type_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tree type removed from project successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Mapping not found
 */

export {};
