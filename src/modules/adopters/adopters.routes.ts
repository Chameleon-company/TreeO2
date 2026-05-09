import { Router } from "express";
import * as controller from "./adopters.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Adopters
 *   description: Adopters management
 */

/**
 * @swagger
 * /adopters:
 *   get:
 *     summary: List adopters
 *     tags: [Adopters]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of adopters
 */
router.get("/", controller.listAdopters);

/**
 * @swagger
 * /adopters/{id}:
 *   get:
 *     summary: Get adopter by ID
 *     tags: [Adopters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Adopter found
 *       404:
 *         description: Adopter not found
 */
router.get("/:id", controller.getAdopter);

/**
 * @swagger
 * /adopters:
 *   post:
 *     summary: Create adopter
 *     tags: [Adopters]
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
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Adopter created
 */
router.post("/", controller.createAdopter);

/**
 * @swagger
 * /adopters/{id}:
 *   put:
 *     summary: Update adopter
 *     tags: [Adopters]
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Adopter updated
 */
router.put("/:id", controller.updateAdopter);

/**
 * @swagger
 * /adopters/{id}:
 *   delete:
 *     summary: Delete adopter
 *     tags: [Adopters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Adopter deleted
 */
router.delete("/:id", controller.deleteAdopter);

export default router;