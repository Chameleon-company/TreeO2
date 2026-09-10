-- CreateIndex
CREATE INDEX "projects_owner_organisation_id_idx" ON "projects"("owner_organisation_id");

-- CreateIndex
CREATE INDEX "reports_requested_by_idx" ON "reports"("requested_by");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "tree_scans_inspector_id_idx" ON "tree_scans"("inspector_id");

-- CreateIndex
CREATE INDEX "tree_scans_fob_id_estimated_planted_year_idx" ON "tree_scans"("fob_id", "estimated_planted_year");

-- CreateIndex
CREATE INDEX "tree_scans_project_id_estimated_planted_year_idx" ON "tree_scans"("project_id", "estimated_planted_year");

-- CreateIndex
CREATE INDEX "user_organisations_organisation_id_idx" ON "user_organisations"("organisation_id");

-- CreateIndex
CREATE INDEX "user_project_roles_project_id_idx" ON "user_project_roles"("project_id");
