-- AlterTable
ALTER TABLE "projects" ADD COLUMN "owner_organisation_id" INTEGER;

-- CreateTable
CREATE TABLE "project_organisations" (
    "project_id" INTEGER NOT NULL,
    "organisation_id" INTEGER NOT NULL,

    CONSTRAINT "project_organisations_pkey" PRIMARY KEY ("project_id","organisation_id")
);

-- CreateIndex
CREATE INDEX "projects_owner_organisation_id_idx" ON "projects"("owner_organisation_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_organisation_id_fkey" FOREIGN KEY ("owner_organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_organisations" ADD CONSTRAINT "project_organisations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_organisations" ADD CONSTRAINT "project_organisations_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
