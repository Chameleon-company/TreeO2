import { Router } from "express";
import * as adopterController from "./adopters.controller";

const router = Router();

/**
 * @openapi
 * /adopters:
 *   post:
 *     tags:
 *       - Adopters
 *     summary: Create adopter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * CREATE ADOPTER
 */
router.post("/", (req, res) => {
  void adopterController.createAdopter(req, res);
});

/**
 * @openapi
 * /adopters:
 *   get:
 *     tags:
 *       - Adopters
 *     summary: Get all adopters
 *     responses:
 *       200:
 *         description: Success
 */

/**
 * GET ALL ADOPTERS
 */
router.get("/", (req, res) => {
  void adopterController.listAdopters(req, res);
});

/**
 * @openapi
 * /adopters/{id}:
 *   get:
 *     tags:
 *       - Adopters
 *     summary: Get adopter by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Not found
 */

/**
 * GET ADOPTER BY ID
 */
router.get("/:id", (req, res) => {
  void adopterController.getAdopterById(req, res);
});

/**
 * @openapi
 * /adopters/{id}:
 *   put:
 *     tags:
 *       - Adopters
 *     summary: Update adopter by ID
 *     description: Updates an existing adopter's details using their ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the adopter to update
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Name
 *               email:
 *                 type: string
 *                 example: updated@gmail.com
 *     responses:
 *       200:
 *         description: Adopter updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *       404:
 *         description: Adopter not found
 *       500:
 *         description: Internal server error
 */
/**
 * UPDATE ADOPTER
 */
router.put("/:id", (req, res) => {
  void adopterController.updateAdopter(req, res);
});

/**
 * @openapi
 * /adopters/{id}:
 *   delete:
 *     tags:
 *       - Adopters
 *     summary: Delete adopter by ID
 *     description: Deletes an adopter from the system using their unique ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the adopter to delete
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Adopter deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Adopter deleted successfully
 *       404:
 *         description: Adopter not found
 *       500:
 *         description: Internal server error
 */
/**
 * DELETE ADOPTER
 */
router.delete("/:id", (req, res) => {
  void adopterController.deleteAdopter(req, res);
});

export default router;
