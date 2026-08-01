/*
  Warnings:

  - A unique constraint covering the columns `[project_id,inspector_id,device_id,client_scan_id]` on the table `tree_scans` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `client_scan_id` to the `tree_scans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "scan_batches" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "device_id" VARCHAR(100);

-- AlterTable
ALTER TABLE "tree_scans" ADD COLUMN     "client_scan_id" UUID NOT NULL,
ADD COLUMN     "scan_timestamp" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "tree_scans_client_scan_id_idx" ON "tree_scans"("client_scan_id");

-- CreateIndex
CREATE UNIQUE INDEX "tree_scans_project_id_inspector_id_device_id_client_scan_id_key" ON "tree_scans"("project_id", "inspector_id", "device_id", "client_scan_id");
