import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { LocalizationController } from "./localization.controller";
import "./localization.docs";

const router = Router();
const localizationController = new LocalizationController();

router.get(
	"/",
	authMiddleware,
	roleMiddleware(["FARMER", "INSPECTOR", "MANAGER", "ADMIN", "DEVELOPER"]),
	(req, res, next) => {
		void localizationController.listLocalizedStrings(req, res).catch(next);
	},
);

router.post(
	"/",
	authMiddleware,
	roleMiddleware(["ADMIN"]),
	(req, res, next) => {
		void localizationController.createLocalizedString(req, res).catch(next);
	},
);

router.put(
	"/:id",
	authMiddleware,
	roleMiddleware(["ADMIN"]),
	(req, res, next) => {
		void localizationController.updateLocalizedString(req, res).catch(next);
	},
);

router.delete(
	"/:id",
	authMiddleware,
	roleMiddleware(["ADMIN"]),
	(req, res, next) => {
		void localizationController.deleteLocalizedString(req, res).catch(next);
	},
);

export default router;
