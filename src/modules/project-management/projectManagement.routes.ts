import { Router } from "express";
import { projectManagementController } from "./projectManagement.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";

const router = Router();

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
// Route to retrieve all projects.
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  (req, res, next) => {
    void projectManagementController.getAllProjects(req, res, next);
  },
);

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
// Route to retrieve a project by its ID.
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  (req, res, next) => {
    void projectManagementController.getProjectById(req, res, next);
  },
);

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
 *               - countryId
 *               - adminLocationId
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
 *             name: Reforestation Project
 *             description: Tree planting initiative
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
// Route to create a new project.
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  (req, res, next) => {
    void projectManagementController.createProject(req, res, next);
  },
);

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
// Route to update an existing project.
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  (req, res, next) => {
    void projectManagementController.updateProject(req, res, next);
  },
);

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
// Route to delete a project.
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  (req, res, next) => {
    void projectManagementController.deleteProject(req, res, next);
  },
);

export default router;
