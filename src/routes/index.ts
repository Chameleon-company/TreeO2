import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import { healthRoutes } from "../modules/health";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);

router.use("/auth", authRoutes);

export default router;
