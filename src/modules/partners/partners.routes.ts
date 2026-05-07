import { Router } from "express";
import { partnersController } from "./partners.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Partners
 *     description: Endpoints for managing partners
 */

/**
 * @swagger
 * /partners:
 *   get:
 *     summary: Retrieve all partners
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Partners retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
// Returns the full list of partners. Accessible by Admin and Manager.
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  (req, res, next) => {
    void partnersController.getAllPartners(req, res, next);
  },
);

/**
 * @swagger
 * /partners/{id}:
 *   get:
 *     summary: Retrieve a partner by ID
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Partner ID
 *     responses:
 *       200:
 *         description: Partner retrieved successfully
 *       400:
 *         description: Invalid partner ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Partner not found
 */
// Returns a single partner by ID. Accessible by Admin and Manager.
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  (req, res, next) => {
    void partnersController.getPartnerById(req, res, next);
  },
);

/**
 * @swagger
 * /partners:
 *   post:
 *     summary: Create a new partner
 *     tags: [Partners]
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
 *             properties:
 *               name:
 *                 type: string
 *           example:
 *             name: TreeO2-Xpand Foundation
 *     responses:
 *       201:
 *         description: Partner created successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: Duplicate entry
 */
// Creates a new partner. Only Admin can do this.
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  (req, res, next) => {
    void partnersController.createPartner(req, res, next);
  },
);

/**
 * @swagger
 * /partners/{id}:
 *   put:
 *     summary: Update an existing partner
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Partner ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *           example:
 *             name: Updated Partner Name
 *     responses:
 *       200:
 *         description: Partner updated successfully
 *       400:
 *         description: Invalid request body or invalid partner ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Partner not found
 *       409:
 *         description: Duplicate entry
 */
// Updates a partner by ID. Only Admin can do this.
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  (req, res, next) => {
    void partnersController.updatePartner(req, res, next);
  },
);

/**
 * @swagger
 * /partners/{id}:
 *   delete:
 *     summary: Delete a partner
 *     tags: [Partners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Partner ID
 *     responses:
 *       200:
 *         description: Partner deleted successfully
 *       400:
 *         description: Invalid partner ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Partner not found
 */
// Deletes a partner by ID. Only Admin can do this.
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  (req, res, next) => {
    void partnersController.deletePartner(req, res, next);
  },
);

export default router;
