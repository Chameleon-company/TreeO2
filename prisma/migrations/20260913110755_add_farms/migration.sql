/*
  Warnings:

  - You are about to drop the column `farmer_id` on the `tree_scans` table. All the data in the column will be lost.
  - Added the required column `farm_id` to the `tree_scans` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FarmStatus" AS ENUM ('active', 'inactive', 'pending');

-- DropForeignKey
ALTER TABLE "tree_scans" DROP CONSTRAINT "tree_scans_farmer_id_fkey";

-- DropIndex
DROP INDEX "tree_scans_farmer_id_idx";

-- AlterTable
ALTER TABLE "tree_scans" DROP COLUMN "farmer_id",
ADD COLUMN     "farm_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "farms" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "farmer_id" INTEGER NOT NULL,
    "farm_code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(255),
    "status" "FarmStatus" NOT NULL DEFAULT 'active',
    "landMappingDate" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tree_scans_farm_id_idx" ON "tree_scans"("farm_id");

-- AddForeignKey
ALTER TABLE "farms" ADD CONSTRAINT "farms_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farms" ADD CONSTRAINT "farms_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tree_scans" ADD CONSTRAINT "tree_scans_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
