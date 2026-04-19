import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validateMiddleware } from "../../middleware/validate.middleware";
import { AuthController } from "./auth.controller";
import "./auth.docs";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth.schemas";

const router = Router();
const authController = new AuthController();

router.post("/login", validateMiddleware(loginSchema), (req, res, next) => {
  void authController.login(req, res).catch(next);
});

router.post(
  "/register",
  validateMiddleware(registerSchema),
  (req, res, next) => {
    void authController.register(req, res).catch(next);
  },
);

router.post("/logout", authMiddleware, (req, res, next) => {
  void authController.logout(req, res).catch(next);
});

router.post(
  "/forgot-password",
  validateMiddleware(forgotPasswordSchema),
  (req, res, next) => {
    void authController.forgotPassword(req, res).catch(next);
  },
);

router.post(
  "/reset-password",
  validateMiddleware(resetPasswordSchema),
  (req, res, next) => {
    void authController.resetPassword(req, res).catch(next);
  },
);

router.get("/me", authMiddleware, (req, res, next) => {
  void authController.me(req, res).catch(next);
});

export default router;
