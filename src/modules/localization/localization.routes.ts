import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { LocalizationController } from "./localization.controller";

const router = Router();
const localizationController = new LocalizationController();

/**
 * @swagger
 * /localized-strings:
 *   get:
 *     summary: List localized strings
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: context
 *         schema:
 *           type: string
 *           enum: [API, MOBILE, ADMIN, PUBLIC]
 *         required: false
 *         description: Filter localized strings by context
 *       - in: query
 *         name: cultureCode
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter localized strings by culture code (for example en-US)
 *     responses:
 *       200:
 *         description: List of localized strings
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/localized-strings",
  authMiddleware,
  roleMiddleware(["FARMER", "INSPECTOR", "MANAGER", "ADMIN", "DEVELOPER"]),
  (req, res, next) => {
    void localizationController.listLocalizedStrings(req, res).catch(next);
  },
);

/**
 * @swagger
 * /localized-strings:
 *   post:
 *     summary: Create a localized string
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cultureCode, stringKey, value, context]
 *             properties:
 *               cultureCode:
 *                 type: string
 *               stringKey:
 *                 type: string
 *               value:
 *                 type: string
 *               context:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/localized-strings",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  (req, res, next) => {
    void localizationController.createLocalizedString(req, res).catch(next);
  },
);

/**
 * @swagger
 * /localized-strings/{id}:
 *   put:
 *     summary: Update a localized string
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Localized string ID
 *     responses:
 *       200:
 *         description: Updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Resource not found
 */
router.put(
  "/localized-strings/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  (req, res, next) => {
    void localizationController.updateLocalizedString(req, res).catch(next);
  },
);

/**
 * @swagger
 * /localized-strings/{id}:
 *   delete:
 *     summary: Delete a localized string
 *     tags: [Localization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Localized string ID
 *     responses:
 *       200:
 *         description: Deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Resource not found
 */
router.delete(
  "/localized-strings/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  (req, res, next) => {
    void localizationController.deleteLocalizedString(req, res).catch(next);
  },
);

export default router;
