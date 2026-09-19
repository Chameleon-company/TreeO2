import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/capability.middleware";
import { LocalizationController } from "./localization.controller";
import "./localization.docs";

const router = Router();
const localizationController = new LocalizationController();

router.get(
	"/",
	authMiddleware,
	requirePermission("localized_strings:read"),
	(req, res, next) => {
		void localizationController.listLocalizedStrings(req, res).catch(next);
	},
);

router.post(
	"/",
	authMiddleware,
	requirePermission("localized_strings:create"),
	(req, res, next) => {
		void localizationController.createLocalizedString(req, res).catch(next);
	},
);

router.put(
	"/:id",
	authMiddleware,
	requirePermission("localized_strings:update"),
	(req, res, next) => {
		void localizationController.updateLocalizedString(req, res).catch(next);
	},
);

router.delete(
	"/:id",
	authMiddleware,
	requirePermission("localized_strings:delete"),
	(req, res, next) => {
		void localizationController.deleteLocalizedString(req, res).catch(next);
	},
);

export default router;
