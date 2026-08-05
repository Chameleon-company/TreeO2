/**
 * @swagger
 * tags:
 *   - name: Project Management
 *     description: Endpoints for managing projects
 */

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Retrieve all projects
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Retrieve a project by ID
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project retrieved successfully
 *       400:
 *         description: Invalid project ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Project not found
 */

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - ownerOrganisationId
 *               - countryId
 *               - adminLocationId
 *             properties:
 *               name:
 *                 type: string
 *               ownerOrganisationId:
 *                 type: integer
 *                 minimum: 1
 *               description:
 *                 type: string
 *                 nullable: true
 *               countryId:
 *                 type: integer
 *                 minimum: 1
 *               adminLocationId:
 *                 type: integer
 *                 minimum: 1
 *               isActive:
 *                 type: boolean
 *           example:
 *             name: Reforestation Project
 *             description: Tree planting initiative
 *             ownerOrganisationId: 1
 *             countryId: 1
 *             adminLocationId: 10
 *             isActive: true
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Country or location not found
 *       409:
 *         description: Duplicate entry
 */

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: Update an existing project
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *                 nullable: true
 *               countryId:
 *                 type: integer
 *               adminLocationId:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *           example:
 *             name: Updated Reforestation Project
 *             description: Expanded planting area
 *             isActive: false
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       400:
 *         description: Invalid request body or invalid project ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Project, country, or location not found
 *       409:
 *         description: Duplicate entry
 */

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Project Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       400:
 *         description: Invalid project ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Project not found
 *       409:
 *         description: Cannot delete project with dependent scans
 */

export {};
