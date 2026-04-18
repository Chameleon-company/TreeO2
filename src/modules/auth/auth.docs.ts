/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication and authorization endpoints
 */

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

/**
 * @swagger
 * /auth/test/protected:
 *   get:
 *     summary: Protected auth test endpoint
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Protected route reached
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /auth/test/admin:
 *   get:
 *     summary: Role-protected auth test endpoint
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

/**
 * @swagger
 * /auth/test/project-scope:
 *   get:
 *     summary: Project-scope auth test endpoint
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

export {};
