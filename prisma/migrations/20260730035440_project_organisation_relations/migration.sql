/*
  Warnings:

  - Added the required column `owner_organisation_id` to the `projects` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AccessType" AS ENUM ('shared', 'owner', 'partner');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "owner_organisation_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "project_organisation" (
    "project_id" INTEGER NOT NULL,
    "organisation_id" INTEGER NOT NULL,
    "access_type" "AccessType" NOT NULL DEFAULT 'shared',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_organisation_pkey" PRIMARY KEY ("project_id","organisation_id")
);

-- CreateIndex
CREATE INDEX "project_organisation_project_id_idx" ON "project_organisation"("project_id");

-- CreateIndex
CREATE INDEX "project_organisation_organisation_id_idx" ON "project_organisation"("organisation_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_organisation_id_fkey" FOREIGN KEY ("owner_organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_organisation" ADD CONSTRAINT "project_organisation_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_organisation" ADD CONSTRAINT "project_organisation_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
