import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import { healthRoutes } from "../modules/health";
import { localizationRoutes } from "../modules/localization";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/localized-strings", localizationRoutes);

export default router;
