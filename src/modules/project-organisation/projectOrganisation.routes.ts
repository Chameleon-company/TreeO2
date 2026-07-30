import { authMiddleware } from "../../middleware/auth.middleware";
import { Router } from "express";
import { validateMiddleware } from "../../middleware/validate.middleware";
import { projectOrganisationController } from "./projectOrganisation.controller";
import { ProjectOrganisationReq } from "./projectOrganisation.schema";

const router = Router();

// TODO: add proper permission auth middleware in, see T2-2026 API13
router.get("/", authMiddleware, (_req, res, next) => {
	void projectOrganisationController.getAllProjectOrganisations(res, next);
});

// TODO: add proper permission auth middleware in, see T2-2026 API13
router.post(
	"/",
	authMiddleware,
	validateMiddleware(ProjectOrganisationReq),
	(req, res, next) => {
		// casting req as ProjectOrganisationReq because validateMiddleware will ensure it is, and error is handled by next()
		void projectOrganisationController.createProjectOrganisation(
			req as ProjectOrganisationReq,
			res,
			next,
		);
	},
);

// TODO: add proper permission auth middleware in, see T2-2026 API13
router.delete(
	"/:projectId/:organisationId",
	authMiddleware,
	(req, res, next) => {
		void projectOrganisationController.deleteProjectOrganisation(
			req,
			res,
			next,
		);
	},
);

export default router;
