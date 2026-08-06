/**
 * @swagger
 * tags:
 *   - name: Organisations
 *     description: Organisation records and tenancy management
 * components:
 *   schemas:
 *     Organisation:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: xpand Foundation
 *         contact_email:
 *           type: string
 *           nullable: true
 *           example: contact@xpand.net.au
 *         government_id:
 *           type: string
 *           nullable: true
 *           example: TL-2026-0042
 *         country_id:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         admin_location_id:
 *           type: integer
 *           nullable: true
 *           example: 3
 *         street_address:
 *           type: string
 *           nullable: true
 *           example: 12 Rua de Dili
 *         logo_id:
 *           type: string
 *           nullable: true
 *           example: logo-xpand-001
 *         description:
 *           type: string
 *           nullable: true
 *           example: Community-led forestry organisation
 *         notes:
 *           type: string
 *           nullable: true
 *           example: Primary partner for the Rai Matak program
 *         account_active:
 *           type: boolean
 *           example: true
 *         date_joined:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: 2026-01-15T00:00:00.000Z
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: 2026-01-28T10:00:00.000Z
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: 2026-01-28T10:00:00.000Z
 *     CreateOrganisationInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: xpand Foundation
 *         contact_email:
 *           type: string
 *           example: contact@xpand.net.au
 *         government_id:
 *           type: string
 *           example: TL-2026-0042
 *         country_id:
 *           type: integer
 *           example: 1
 *         admin_location_id:
 *           type: integer
 *           example: 3
 *         street_address:
 *           type: string
 *           example: 12 Rua de Dili
 *         logo_id:
 *           type: string
 *           example: logo-xpand-001
 *         description:
 *           type: string
 *           example: Community-led forestry organisation
 *         notes:
 *           type: string
 *           example: Primary partner for the Rai Matak program
 *     UpdateOrganisationInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: xpand Foundation Timor-Leste
 *         contact_email:
 *           type: string
 *           example: updated@xpand.net.au
 *         description:
 *           type: string
 *           example: Updated organisation description
 *         account_active:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /organisations:
 *   get:
 *     summary: List organisations
 *     description: Returns a paginated list of organisations. Authenticated access.
 *     tags: [Organisations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Organisations fetched successfully
 *       400:
 *         description: Invalid pagination parameters
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /organisations/{id}:
 *   get:
 *     summary: Get organisation details
 *     description: Returns a single organisation by id. Authenticated access.
 *     tags: [Organisations]
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
 *         description: Organisation fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Organisation not found
 */

/**
 * @swagger
 * /organisations:
 *   post:
 *     summary: Create organisation
 *     description: Creates a new organisation record.
 *     tags: [Organisations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrganisationInput'
 *           example:
 *             name: xpand Foundation
 *             contact_email: contact@xpand.net.au
 *             description: Community-led forestry organisation
 *     responses:
 *       201:
 *         description: Organisation created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Contact email already exists
 */

/**
 * @swagger
 * /organisations/{id}:
 *   put:
 *     summary: Update organisation
 *     description: Updates an existing organisation. At least one field is required.
 *     tags: [Organisations]
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
 *             $ref: '#/components/schemas/UpdateOrganisationInput'
 *           example:
 *             description: Updated organisation description
 *     responses:
 *       200:
 *         description: Organisation updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Organisation not found
 *       409:
 *         description: Contact email already exists
 */

/**
 * @swagger
 * /organisations/{id}:
 *   delete:
 *     summary: Deactivate organisation
 *     description: Deactivates an organisation by setting account_active to false. Records are never hard deleted, in line with the retention rules in the technical specification. Fails if the organisation still has active users.
 *     tags: [Organisations]
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
 *         description: Organisation deactivated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Organisation not found
 *       409:
 *         description: Organisation has active users and cannot be deactivated
 */

export {};