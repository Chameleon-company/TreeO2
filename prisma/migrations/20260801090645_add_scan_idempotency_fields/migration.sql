/*
  Warnings:

  - A unique constraint covering the columns `[project_id,inspector_id,device_id,client_scan_id]` on the table `tree_scans` will be added. If there are existing duplicate values, this will fail.
  - A required column `client_scan_id` was added to the `tree_scans` table with no default value. This is not possible if the table is not empty.

  How each warning is handled below:

  - Required column: `client_scan_id` is added nullable, backfilled with generated
    UUIDs, then set NOT NULL, so the migration does not abort on a populated table.
  - Unique constraint: the backfill assigns a distinct UUID to every existing row,
    so no two existing rows can collide on
    (project_id, inspector_id, device_id, client_scan_id). The unique index is
    therefore created only after the backfill has completed.
*/
-- AlterTable
ALTER TABLE "scan_batches" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "device_id" VARCHAR(100);

-- AlterTable
ALTER TABLE "tree_scans" ADD COLUMN     "scan_timestamp" TIMESTAMP(3);

-- Add client_scan_id safely: adding a NOT NULL column with no default aborts
-- on a table that already has rows. Add it nullable, backfill existing rows,
-- then enforce NOT NULL.
ALTER TABLE "tree_scans" ADD COLUMN     "client_scan_id" UUID;
UPDATE "tree_scans" SET "client_scan_id" = gen_random_uuid() WHERE "client_scan_id" IS NULL;
ALTER TABLE "tree_scans" ALTER COLUMN "client_scan_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "tree_scans_client_scan_id_idx" ON "tree_scans"("client_scan_id");

-- CreateIndex
CREATE UNIQUE INDEX "tree_scans_project_id_inspector_id_device_id_client_scan_id_key" ON "tree_scans"("project_id", "inspector_id", "device_id", "client_scan_id");
