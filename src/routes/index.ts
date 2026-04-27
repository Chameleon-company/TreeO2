import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import { healthRoutes } from "../modules/health";
import { projectManagementRoutes } from "../modules/project-management";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/projects", projectManagementRoutes);

export default router;
