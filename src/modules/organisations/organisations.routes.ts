import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validateMiddleware } from "../../middleware/validate.middleware";
import { organisationsController } from "./organisations.controller";
import "./organisations.docs";
import {
  createOrganisationSchema,
  deleteOrganisationSchema,
  listOrganisationsSchema,
  organisationIdSchema,
  updateOrganisationSchema,
} from "./organisations.schemas";

const router = Router();

router.get(
  "/",
  authMiddleware,
  validateMiddleware(listOrganisationsSchema),
  (req, res, next) => {
    void organisationsController.listOrganisations(req, res).catch(next);
  },
);

router.get(
  "/:id",
  authMiddleware,
  validateMiddleware(organisationIdSchema),
  (req, res, next) => {
    void organisationsController.getOrganisationById(req, res).catch(next);
  },
);

router.post(
  "/",
  authMiddleware,
  validateMiddleware(createOrganisationSchema),
  (req, res, next) => {
    void organisationsController.createOrganisation(req, res).catch(next);
  },
);

router.put(
  "/:id",
  authMiddleware,
  validateMiddleware(updateOrganisationSchema),
  (req, res, next) => {
    void organisationsController.updateOrganisation(req, res).catch(next);
  },
);

router.delete(
  "/:id",
  authMiddleware,
  validateMiddleware(deleteOrganisationSchema),
  (req, res, next) => {
    void organisationsController.deleteOrganisation(req, res).catch(next);
  },
);

export default router;