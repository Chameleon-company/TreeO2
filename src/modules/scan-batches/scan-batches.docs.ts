/**
 * @swagger
 * tags:
 *   name: Scan Batches
 *   description: Scan batch upload and management endpoints
 */

/**
 * @swagger
 * /scan-batches:
 *   get:
 *     summary: Retrieve scan batches
 *     description: Admin can view all batches. Managers can view batches for assigned projects. Inspectors can view only their own batches.
 *     tags: [Scan Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           example: 20
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: inspector_id
 *         schema:
 *           type: integer
 *           example: 2
 *     responses:
 *       200:
 *         description: Scan batches fetched successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /scan-batches/{id}:
 *   get:
 *     summary: Retrieve a scan batch by ID
 *     description: Admin can view any batch. Managers can view batches from assigned projects. Inspectors can view only their own batches.
 *     tags: [Scan Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     responses:
 *       200:
 *         description: Scan batch fetched successfully
 *       400:
 *         description: Invalid scan batch ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: You do not have permission to access this scan batch
 *       404:
 *         description: Scan batch not found
 */

/**
 * @swagger
 * /scan-batches:
 *   post:
 *     summary: Upload a new scan batch
 *     description: Inspector-only endpoint. Creates one scan batch and associates all submitted tree scans with that batch. All scans must belong to the same inspector and project. Fob recycling is not automatically applied.
 *     tags: [Scan Batches]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - scans
 *             properties:
 *               project_id:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *               uploaded_at:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-05-20T10:35:00.000Z
 *               scans:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 500
 *                 items:
 *                   type: object
 *                   required:
 *                     - fob_id
 *                     - farmer_id
 *                     - species_id
 *                     - estimated_planted_year
 *                     - estimated_planted_month
 *                   properties:
 *                     fob_id:
 *                       type: string
 *                       maxLength: 80
 *                       example: NFC-001
 *                     farmer_id:
 *                       type: integer
 *                       minimum: 1
 *                       example: 10
 *                     species_id:
 *                       type: integer
 *                       minimum: 1
 *                       example: 2
 *                     estimated_planted_year:
 *                       type: integer
 *                       minimum: 1950
 *                       example: 2024
 *                     estimated_planted_month:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 12
 *                       example: 5
 *                     planted_date:
 *                       type: string
 *                       format: date
 *                       example: 2024-05-20
 *                     height_m:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *                       example: 2.5
 *                     circumference_cm:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 4000
 *                       example: 45.3
 *                     diameter_cm:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 1000
 *                       example: 14.4
 *                     latitude:
 *                       type: number
 *                       minimum: -90
 *                       maximum: 90
 *                       example: -8.5569
 *                     longitude:
 *                       type: number
 *                       minimum: -180
 *                       maximum: 180
 *                       example: 125.5603
 *                     device_id:
 *                       type: string
 *                       maxLength: 100
 *                       example: MOB-001
 *                     photo_id:
 *                       type: string
 *                       format: uuid
 *                       example: 550e8400-e29b-41d4-a716-446655440000
 *           example:
 *             project_id: 1
 *             uploaded_at: 2024-05-20T10:35:00.000Z
 *             scans:
 *               - fob_id: NFC-001
 *                 farmer_id: 10
 *                 species_id: 2
 *                 estimated_planted_year: 2024
 *                 estimated_planted_month: 5
 *                 planted_date: 2024-05-20
 *                 height_m: 2.5
 *                 circumference_cm: 45.3
 *                 diameter_cm: 14.4
 *                 latitude: -8.5569
 *                 longitude: 125.5603
 *                 device_id: MOB-001
 *     responses:
 *       201:
 *         description: Scan batch uploaded successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not allowed to upload this scan batch
 *       404:
 *         description: Inspector, project, farmer, or species not found
 *       422:
 *         description: Business rule validation failed, such as inactive project, farmer not assigned, species not assigned to project, or invalid measurement/date values
 */

/**
 * @swagger
 * /scan-batches/{id}:
 *   delete:
 *     summary: Delete a scan batch
 *     description: Admin-only endpoint. A scan batch cannot be deleted if it has related tree scans. This protects historical scan data.
 *     tags: [Scan Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     responses:
 *       200:
 *         description: Scan batch deleted successfully
 *       400:
 *         description: Invalid scan batch ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only Admin users can delete scan batches
 *       404:
 *         description: Scan batch not found
 *       409:
 *         description: Scan batch cannot be deleted because it has related tree scans
 */
