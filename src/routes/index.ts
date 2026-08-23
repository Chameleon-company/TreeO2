import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import { healthRoutes } from "../modules/health";
import { projectTreeTypesRoutes } from "../modules/project-tree-types";
import userRoutes from "../modules/user-management";
import { treeTypesRoutes } from "../modules/tree-types";
import { projectManagementRoutes } from "../modules/project-management";
import { localizationRoutes } from "../modules/localization";
import { adoptersRouter } from "../modules/adopters";
import { adoptionsRoutes } from "../modules/adoptions";
import { userProjectAssignmentRoutes } from "../modules/user-project-assignment";
import { partnersRoutes } from "../modules/partners";
import { scanBatchesRoutes } from "../modules/scan-batches";
import { organisationsRoutes } from "../modules/organisations";
import treeScansRoutes from "../modules/tree-scans";
import { projectOrganisationRoutes } from "../modules/project-organisation";
import { userOrganisationsRoutes } from "../modules/user-organisations";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/adopters", adoptersRouter);
router.use("/adoptions", adoptionsRoutes);
router.use("/users", userRoutes);
router.use("/tree-types", treeTypesRoutes);
router.use("/projects", projectManagementRoutes);
router.use("/project-organisations", projectOrganisationRoutes);
router.use("/localized-strings", localizationRoutes);
router.use("/user-projects", userProjectAssignmentRoutes);
router.use("/project-tree-types", projectTreeTypesRoutes);
router.use("/partners", partnersRoutes);
router.use("/scan-batches", scanBatchesRoutes);
router.use("/organisations", organisationsRoutes);
router.use("/user-organisations", userOrganisationsRoutes);
router.use("/tree-scans", treeScansRoutes);

export default router;
