import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/capability.middleware";
import { validateMiddleware } from "../../middleware/validate.middleware";
import { organisationsController } from "./organisations.controller";
import "./organisations.docs";
import {
	CreateOrganisationReq,
	ListOrganisationsReq,
	OrganisationIdReq,
	UpdateOrganisationReq,
} from "./organisations.schemas";

const router = Router();

router.get(
	"/",
	authMiddleware,
	requirePermission("organisations:read"),
	validateMiddleware(ListOrganisationsReq),
	(req, res, next) => {
		// casting req as ListOrganisationsReq because validateMiddleware will ensure it is, and error is handled by next()
		void organisationsController
			.listOrganisations(req as unknown as ListOrganisationsReq, res)
			.catch(next);
	},
);

router.get(
	"/:id",
	authMiddleware,
	requirePermission("organisations:read"),
	validateMiddleware(OrganisationIdReq),
	(req, res, next) => {
		void organisationsController
			.getOrganisationById(req as unknown as OrganisationIdReq, res)
			.catch(next);
	},
);

router.post(
	"/",
	authMiddleware,
	requirePermission("organisations:create"),
	validateMiddleware(CreateOrganisationReq),
	(req, res, next) => {
		void organisationsController
			.createOrganisation(req as unknown as CreateOrganisationReq, res)
			.catch(next);
	},
);

router.put(
	"/:id",
	authMiddleware,
	requirePermission("organisations:update"),
	validateMiddleware(UpdateOrganisationReq),
	(req, res, next) => {
		void organisationsController
			.updateOrganisation(req as unknown as UpdateOrganisationReq, res)
			.catch(next);
	},
);

router.delete(
	"/:id",
	authMiddleware,
	requirePermission("organisations:delete"),
	validateMiddleware(OrganisationIdReq),
	(req, res, next) => {
		void organisationsController
			.deleteOrganisation(req as unknown as OrganisationIdReq, res)
			.catch(next);
	},
);

export default router;
