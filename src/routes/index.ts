import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import { healthRoutes } from "../modules/health";
import { projectTreeTypesRoutes } from "../modules/project-tree-types";
import userRoutes from "../modules/user-management";
import { treeTypesRoutes } from "../modules/tree-types";
import { projectManagementRoutes } from "../modules/project-management";
import { localizationRoutes } from "../modules/localization";
import { adoptersRouter } from "../modules/adopters";
import { userProjectAssignmentRoutes } from "../modules/user-project-assignment";
import { partnersRoutes } from "../modules/partners";


import treeScansRoutes from "../modules/tree-scans";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/adopters", adoptersRouter);
router.use("/users", userRoutes);
router.use("/tree-types", treeTypesRoutes);
router.use("/projects", projectManagementRoutes);
router.use("/localized-strings", localizationRoutes);
router.use("/user-projects", userProjectAssignmentRoutes);
router.use("/project-tree-types", projectTreeTypesRoutes);
router.use("/partners", partnersRoutes);

router.use("/tree-scans", treeScansRoutes);

router.use("/dashboard", dashboardRoutes);

export default router;
