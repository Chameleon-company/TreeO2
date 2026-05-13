/**
 * @swagger
 * tags:
 *   - name: Tree Scans
 *     description: Tree scan management and tracking
 * components:
 *   schemas:
 *     TreeScan:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         fobId:
 *           type: string
 *           example: FOB-001
 *         projectId:
 *           type: integer
 *           example: 1
 *         farmerId:
 *           type: integer
 *           example: 2
 *         inspectorId:
 *           type: integer
 *           example: 4
 *         speciesId:
 *           type: integer
 *           example: 3
 *         estimatedPlantedYear:
 *           type: integer
 *           example: 2020
 *         estimatedPlantedMonth:
 *           type: integer
 *           example: 6
 *         plantedDate:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: 2020-06-10
 *         heightM:
 *           type: number
 *           nullable: true
 *           example: 3.25
 *         circumferenceCm:
 *           type: number
 *           nullable: true
 *           example: 18.4
 *         diameterCm:
 *           type: number
 *           nullable: true
 *           example: 5.8
 *         latitude:
 *           type: number
 *           nullable: true
 *           example: -37.8136
 *         longitude:
 *           type: number
 *           nullable: true
 *           example: 144.9631
 *         photoId:
 *           type: string
 *           nullable: true
 *           example: 550e8400-e29b-41d4-a716-446655440000
 *         batchId:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         deviceId:
 *           type: string
 *           nullable: true
 *           example: DEVICE-001
 *         isArchived:
 *           type: boolean
 *           example: false
 *         isCorrected:
 *           type: boolean
 *           example: false
 *         correctedBy:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         correctionReason:
 *           type: string
 *           nullable: true
 *           example: Measurement corrected after inspection
 *         isValid:
 *           type: boolean
 *           example: true
 *         validationNotes:
 *           type: string
 *           nullable: true
 *           example: Healthy tree
 *
 *     CreateTreeScanInput:
 *       type: object
 *       required:
 *         - fobId
 *         - projectId
 *         - farmerId
 *         - inspectorId
 *         - speciesId
 *         - estimatedPlantedYear
 *         - estimatedPlantedMonth
 *       properties:
 *         fobId:
 *           type: string
 *           example: FOB-001
 *         projectId:
 *           type: integer
 *           example: 1
 *         farmerId:
 *           type: integer
 *           example: 2
 *         inspectorId:
 *           type: integer
 *           example: 4
 *         speciesId:
 *           type: integer
 *           example: 3
 *         estimatedPlantedYear:
 *           type: integer
 *           example: 2020
 *         estimatedPlantedMonth:
 *           type: integer
 *           example: 6
 *         plantedDate:
 *           type: string
 *           format: date
 *           nullable: true
 *         heightM:
 *           type: number
 *           nullable: true
 *         circumferenceCm:
 *           type: number
 *           nullable: true
 *         diameterCm:
 *           type: number
 *           nullable: true
 *         latitude:
 *           type: number
 *           nullable: true
 *         longitude:
 *           type: number
 *           nullable: true
 *         photoId:
 *           type: string
 *           nullable: true
 *         batchId:
 *           type: integer
 *           nullable: true
 *         deviceId:
 *           type: string
 *           nullable: true
 *         validationNotes:
 *           type: string
 *           nullable: true
 */

/**
 * @swagger
 * /tree-scans:
 *   get:
 *     summary: List tree scans
 *     description: Returns paginated tree scans with optional filters.
 *     tags: [Tree Scans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: projectId
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: farmerId
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: inspectorId
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: speciesId
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: batchId
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isArchived
 *         required: false
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isValid
 *         required: false
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Tree scans fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /tree-scans/{id}:
 *   get:
 *     summary: Get tree scan by ID
 *     description: Returns a single tree scan.
 *     tags: [Tree Scans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tree scan fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Tree scan not found
 */

/**
 * @swagger
 * /tree-scans:
 *   post:
 *     summary: Create tree scan
 *     description: Creates a new tree scan.
 *     tags: [Tree Scans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTreeScanInput'
 *     responses:
 *       201:
 *         description: Tree scan created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Related resource not found
 */

/**
 * @swagger
 * /tree-scans/{id}:
 *   put:
 *     summary: Update tree scan
 *     description: Updates an existing tree scan and records audit data.
 *     tags: [Tree Scans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Tree scan updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Tree scan not found
 */

/**
 * @swagger
 * /tree-scans/{id}:
 *   delete:
 *     summary: Archive tree scan
 *     description: Soft deletes a tree scan using isArchived flag.
 *     tags: [Tree Scans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tree scan archived successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Tree scan not found
 */

/**
 * @swagger
 * /tree-scans/recycle/{fobId}:
 *   post:
 *     summary: Recycle FOB scans
 *     description: Archives all active scans linked to a FOB ID.
 *     tags: [Tree Scans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: FOB scans archived successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: No scans found for FOB ID
 */

export {};
