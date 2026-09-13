/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: Aggregated tree, scan and activity metrics scoped to the caller's access level
 * components:
 *   parameters:
 *     DashboardProjectId:
 *       in: query
 *       name: projectId
 *       required: false
 *       description: Only honoured for SystemAdmin without a selected project. For project-scoped tokens it must match the token's project.
 *       schema:
 *         type: integer
 *     DashboardYear:
 *       in: query
 *       name: year
 *       required: false
 *       description: Filter by estimated planted year
 *       schema:
 *         type: integer
 *         minimum: 1900
 *         maximum: 2100
 *     DashboardSpeciesId:
 *       in: query
 *       name: speciesId
 *       required: false
 *       schema:
 *         type: integer
 *   schemas:
 *     DashboardScopeLevel:
 *       type: string
 *       description: Data scope the numbers were computed under
 *       enum: [global, project, inspector, farmer]
 *     DashboardTotals:
 *       type: object
 *       properties:
 *         scope:
 *           $ref: '#/components/schemas/DashboardScopeLevel'
 *         projectId:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         trees:
 *           type: integer
 *           description: Distinct fob IDs with at least one non-archived scan
 *           example: 1240
 *         scans:
 *           type: integer
 *           description: Non-archived scans
 *           example: 3110
 *         archivedScans:
 *           type: integer
 *           example: 42
 *         farmers:
 *           type: integer
 *           example: 87
 *         inspectors:
 *           type: integer
 *           example: 6
 *         species:
 *           type: integer
 *           example: 4
 *         batches:
 *           type: integer
 *           nullable: true
 *           description: Null for farmer scope (batches are not linked to farmers)
 *           example: 58
 *         projects:
 *           type: integer
 *           description: Active projects; only present for global scope
 *           example: 3
 *     TreeCountRow:
 *       type: object
 *       properties:
 *         key:
 *           type: integer
 *           description: Group key (year, or the id of the project/farmer/inspector/species)
 *           example: 2023
 *         label:
 *           type: string
 *           nullable: true
 *           example: Rai Matak North
 *         trees:
 *           type: integer
 *           example: 410
 *     TreeCounts:
 *       type: object
 *       properties:
 *         scope:
 *           $ref: '#/components/schemas/DashboardScopeLevel'
 *         groupBy:
 *           type: string
 *           enum: [year, project, farmer, inspector, species]
 *         rows:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TreeCountRow'
 *         total:
 *           type: integer
 *           example: 1240
 *     ScanStats:
 *       type: object
 *       properties:
 *         scope:
 *           $ref: '#/components/schemas/DashboardScopeLevel'
 *         scans:
 *           type: integer
 *           description: Non-archived scans in range
 *         archived:
 *           type: integer
 *         corrected:
 *           type: integer
 *           description: Non-archived scans currently flagged as corrected
 *         valid:
 *           type: integer
 *         invalid:
 *           type: integer
 *         events:
 *           type: object
 *           description: tree_scan_audit rows by change type in range
 *           properties:
 *             created:
 *               type: integer
 *             corrected:
 *               type: integer
 *             archived:
 *               type: integer
 *             validated:
 *               type: integer
 *         series:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               bucket:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-03-01T00:00:00.000Z
 *               scans:
 *                 type: integer
 *                 example: 120
 */

/**
 * @swagger
 * /dashboard/totals:
 *   get:
 *     summary: Summary totals for the caller's access scope
 *     description: |
 *       Requires the `dashboard:read` capability and a project-scoped token (SystemAdmin may omit project scope for global totals).
 *       Scope is applied server-side: SystemAdmin (all or selected project), OrganisationAdmin (project linked to their organisation),
 *       Manager (assigned project), Inspector (own scans), Farmer (own trees). Tree counts use the shared latest-scan-per-fob query.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/DashboardProjectId'
 *       - $ref: '#/components/parameters/DashboardYear'
 *       - $ref: '#/components/parameters/DashboardSpeciesId'
 *     responses:
 *       200:
 *         description: Totals fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DashboardTotals'
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Missing project scope, insufficient permissions, project not linked to organisation, or projectId filter mismatch
 *       404:
 *         description: Project not found
 */

/**
 * @swagger
 * /dashboard/tree-counts:
 *   get:
 *     summary: Distinct tree counts grouped by year, project, farmer, inspector or species
 *     description: |
 *       Counts distinct fob IDs from the shared latest-non-archived-scan-per-fob/year query.
 *       `groupBy=farm` is reserved and returns 501 until a Farm model exists in the schema.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: groupBy
 *         required: false
 *         schema:
 *           type: string
 *           enum: [year, project, farmer, inspector, species, farm]
 *           default: year
 *       - $ref: '#/components/parameters/DashboardProjectId'
 *       - $ref: '#/components/parameters/DashboardYear'
 *       - $ref: '#/components/parameters/DashboardSpeciesId'
 *     responses:
 *       200:
 *         description: Tree counts fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TreeCounts'
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorised for the requested scope
 *       404:
 *         description: Project not found
 *       501:
 *         description: groupBy=farm is not implemented yet
 */

/**
 * @swagger
 * /dashboard/scan-stats:
 *   get:
 *     summary: Scan activity, correction, validation and archive statistics
 *     description: |
 *       Counts are split by archive/correction/validity flags on `tree_scans`, plus audit event counts from `tree_scan_audit`.
 *       `from`/`to` bound `upload_timestamp` (scans) and `changed_at` (events). `series` groups non-archived uploads by bucket.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/DashboardProjectId'
 *       - $ref: '#/components/parameters/DashboardYear'
 *       - $ref: '#/components/parameters/DashboardSpeciesId'
 *       - in: query
 *         name: from
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-01-01
 *       - in: query
 *         name: to
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-06-30
 *       - in: query
 *         name: bucket
 *         required: false
 *         schema:
 *           type: string
 *           enum: [month, year]
 *           default: month
 *     responses:
 *       200:
 *         description: Scan statistics fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ScanStats'
 *       400:
 *         description: Invalid query parameters (including from after to)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorised for the requested scope
 *       404:
 *         description: Project not found
 */

export {};
