import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { validateMiddleware } from "../../middleware/validate.middleware";
import { ProjectTreeTypesController } from "./projectTreeTypes.controller";
import "./projectTreeTypes.docs";
import {
  createProjectTreeTypeSchema,
  deleteProjectTreeTypeSchema,
  listProjectTreeTypesSchema,
} from "./projectTreeTypes.schemas";

const router = Router();
const projectTreeTypesController = new ProjectTreeTypesController();

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  validateMiddleware(listProjectTreeTypesSchema),
  (req, res, next) => {
    void projectTreeTypesController.listProjectTreeTypes(req, res).catch(next);
  },
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  validateMiddleware(createProjectTreeTypeSchema),
  (req, res, next) => {
    void projectTreeTypesController.addProjectTreeType(req, res).catch(next);
  },
);

router.delete(
  "/:project_id/:tree_type_id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  validateMiddleware(deleteProjectTreeTypeSchema),
  (req, res, next) => {
    void projectTreeTypesController.removeProjectTreeType(req, res).catch(next);
  },
);

export default router;
