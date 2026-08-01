import { Router } from "express";
import { env } from "../../config/env";
import { authMiddleware } from "../../middleware/auth.middleware";
import { projectScopeMiddleware } from "../../middleware/projectScope.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { validateMiddleware } from "../../middleware/validate.middleware";
import { AuthController } from "./auth.controller";
import {
	forgotPasswordSchema,
	loginSchema,
	resetPasswordSchema,
} from "./auth.schemas";

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication and authorization endpoints
 */
const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login endpoint scaffold
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *     responses:
 *       501:
 *         description: Not implemented
 */
router.post("/login", validateMiddleware(loginSchema), (req, res, next) => {
	void authController.login(req, res).catch(next);
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout endpoint scaffold
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       501:
 *         description: Not implemented
 */
router.post("/logout", authMiddleware, (req, res, next) => {
	void authController.logout(req, res).catch(next);
});

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Forgot password endpoint scaffold
 *     tags: [Auth]
 *     responses:
 *       501:
 *         description: Not implemented
 */
router.post(
	"/forgot-password",
	validateMiddleware(forgotPasswordSchema),
	(req, res, next) => {
		void authController.forgotPassword(req, res).catch(next);
	},
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password endpoint scaffold
 *     tags: [Auth]
 *     responses:
 *       501:
 *         description: Not implemented
 */
router.post(
	"/reset-password",
	validateMiddleware(resetPasswordSchema),
	(req, res, next) => {
		void authController.resetPassword(req, res).catch(next);
	},
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Current authenticated user scaffold
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       501:
 *         description: Not implemented
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authMiddleware, (req, res, next) => {
	void authController.me(req, res).catch(next);
});

if (env.NODE_ENV === "development" && env.AUTH_DEV_MODE) {
	/**
	 * @swagger
	 * /auth/test/protected:
	 *   get:
	 *     summary: Protected auth test endpoint
	 *     description: Development only. Temporary protected test route for auth middleware verification.
	 *     tags: [Auth]
	 *     security:
	 *       - bearerAuth: []
	 *     responses:
	 *       200:
	 *         description: Protected route reached
	 *       401:
	 *         description: Unauthorized
	 */
	router.get("/test/protected", authMiddleware, (req, res) => {
		authController.getProtectedTest(req, res);
	});

	/**
	 * @swagger
	 * /auth/test/admin:
	 *   get:
	 *     summary: Role-protected auth test endpoint
	 *     description: Development only. Temporary role-protected test route for auth and role middleware verification.
	 *     tags: [Auth]
	 *     security:
	 *       - bearerAuth: []
	 *     responses:
	 *       200:
	 *         description: Admin route reached
	 *       401:
	 *         description: Unauthorized
	 *       403:
	 *         description: Forbidden
	 */
	router.get(
		"/test/admin",
		authMiddleware,
		roleMiddleware(["ADMIN"]),
		(req, res) => {
			authController.getAdminTest(req, res);
		},
	);

	/**
	 * @swagger
	 * /auth/test/project-scope:
	 *   get:
	 *     summary: Project-scope auth test endpoint
	 *     description: Development only. Temporary project-scope test route for auth and project scope middleware verification.
	 *     tags: [Auth]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: header
	 *         name: x-project-id
	 *         required: true
	 *         schema:
	 *           type: integer
	 *     responses:
	 *       200:
	 *         description: Project-scope route reached
	 *       401:
	 *         description: Unauthorized
	 *       403:
	 *         description: Forbidden
	 */
	router.get(
		"/test/project-scope",
		authMiddleware,
		projectScopeMiddleware,
		(req, res) => {
			authController.getProjectScopeTest(req, res);
		},
	);
}

export default router;
