import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
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

// TODO: add capability-based permission middleware once the sec/auth stream lands it
router.get(
	"/",
	authMiddleware,
	validateMiddleware(ListOrganisationsReq),
	(req, res, next) => {
		// casting req as ListOrganisationsReq because validateMiddleware will ensure it is, and error is handled by next()
		void organisationsController
			.listOrganisations(req as unknown as ListOrganisationsReq, res)
			.catch(next);
	},
);

// TODO: add capability-based permission middleware once the sec/auth stream lands it
router.get(
	"/:id",
	authMiddleware,
	validateMiddleware(OrganisationIdReq),
	(req, res, next) => {
		void organisationsController
			.getOrganisationById(req as unknown as OrganisationIdReq, res)
			.catch(next);
	},
);

// TODO: add capability-based permission middleware once the sec/auth stream lands it
router.post(
	"/",
	authMiddleware,
	validateMiddleware(CreateOrganisationReq),
	(req, res, next) => {
		void organisationsController
			.createOrganisation(req as unknown as CreateOrganisationReq, res)
			.catch(next);
	},
);

// TODO: add capability-based permission middleware once the sec/auth stream lands it
router.put(
	"/:id",
	authMiddleware,
	validateMiddleware(UpdateOrganisationReq),
	(req, res, next) => {
		void organisationsController
			.updateOrganisation(req as unknown as UpdateOrganisationReq, res)
			.catch(next);
	},
);

// TODO: add capability-based permission middleware once the sec/auth stream lands it
router.delete(
	"/:id",
	authMiddleware,
	validateMiddleware(OrganisationIdReq),
	(req, res, next) => {
		void organisationsController
			.deleteOrganisation(req as unknown as OrganisationIdReq, res)
			.catch(next);
	},
);

export default router;
