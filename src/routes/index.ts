import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import { healthRoutes } from "../modules/health";
import { projectTreeTypesRoutes } from "../modules/project-tree-types";
import userRoutes from "../modules/user-management";
import { treeTypesRoutes } from "../modules/tree-types";
import { projectManagementRoutes } from "../modules/project-management";
import { localizationRoutes } from "../modules/localization";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/tree-types", treeTypesRoutes);
router.use("/projects", projectManagementRoutes);
router.use("/localized-strings", localizationRoutes);
router.use("/project-tree-types", projectTreeTypesRoutes);

export default router;
