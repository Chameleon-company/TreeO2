import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import { healthRoutes } from "../modules/health";
import userRoutes from "../modules/user-management";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);

export default router;
