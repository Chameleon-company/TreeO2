import { Router } from "express";
import { env } from "../../config/env";
import { authMiddleware } from "../../middleware/auth.middleware";
import { projectScopeMiddleware } from "../../middleware/projectScope.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { validateMiddleware } from "../../middleware/validate.middleware";
import { AuthController } from "./auth.controller";
import "./auth.docs";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "./auth.schemas";

const router = Router();
const authController = new AuthController();

router.post("/login", validateMiddleware(loginSchema), (req, res, next) => {
  void authController.login(req, res).catch(next);
});

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

if (env.NODE_ENV === "development" && env.AUTH_DEV_MODE) {
  router.get("/test/protected", authMiddleware, (req, res, next) => {
    void authController.getProtectedTest(req, res).catch(next);
  });

  router.get(
    "/test/admin",
    authMiddleware,
    roleMiddleware(["ADMIN"]),
    (req, res, next) => {
      void authController.getAdminTest(req, res).catch(next);
    },
  );

  router.get(
    "/test/project-scope",
    authMiddleware,
    projectScopeMiddleware,
    (req, res, next) => {
      void authController.getProjectScopeTest(req, res).catch(next);
    },
  );
}

export default router;
