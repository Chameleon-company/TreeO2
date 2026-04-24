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
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 example: Test User
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 300
 *                 example: test@treeo2.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 72
 *                 example: Test@1234
 *               role:
 *                 type: string
 *                 enum: [FARMER, INSPECTOR, MANAGER, ADMIN, DEVELOPER]
 *                 example: FARMER
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: Test User
 *                     email:
 *                       type: string
 *                       example: test@treeo2.com
 *                     role:
 *                       type: string
 *                       example: FARMER
 *       400:
 *         description: Validation failed
 *       409:
 *         description: Email already exists
 */
/**

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

export {};
