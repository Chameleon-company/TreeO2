/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "administrative_levels" (
    "id" SERIAL NOT NULL,
    "country_id" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "administrative_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adopters" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adopters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adoptions" (
    "id" SERIAL NOT NULL,
    "adopter_id" INTEGER NOT NULL,
    "fob_id" VARCHAR(80) NOT NULL,
    "adopted_at" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adoptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "iso2" CHAR(2) NOT NULL,
    "iso3" CHAR(3),

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cultures" (
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "cultures_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "localized_strings" (
    "id" SERIAL NOT NULL,
    "culture_code" VARCHAR(10) NOT NULL,
    "string_key" VARCHAR(255) NOT NULL,
    "value" TEXT NOT NULL,
    "context" VARCHAR(50) NOT NULL,

    CONSTRAINT "localized_strings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" SERIAL NOT NULL,
    "country_id" INTEGER NOT NULL,
    "parent_id" INTEGER,
    "level" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "code" VARCHAR(50),
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "country_id" INTEGER,
    "admin_location_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_tree_types" (
    "project_id" INTEGER NOT NULL,
    "tree_type_id" INTEGER NOT NULL,

    CONSTRAINT "project_tree_types_pkey" PRIMARY KEY ("project_id","tree_type_id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "report_type" VARCHAR(100) NOT NULL,
    "requested_by" INTEGER,
    "status" VARCHAR(50) NOT NULL,
    "parameters" JSONB NOT NULL,
    "output_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_batches" (
    "id" SERIAL NOT NULL,
    "inspector_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tree_scans" (
    "id" SERIAL NOT NULL,
    "fob_id" VARCHAR(80) NOT NULL,
    "project_id" INTEGER NOT NULL,
    "farmer_id" INTEGER NOT NULL,
    "inspector_id" INTEGER NOT NULL,
    "species_id" INTEGER NOT NULL,
    "estimated_planted_year" INTEGER NOT NULL,
    "estimated_planted_month" INTEGER NOT NULL,
    "planted_date" DATE,
    "height_m" DECIMAL(12,3),
    "circumference_cm" DECIMAL(12,3),
    "diameter_cm" DECIMAL(12,3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "photo_id" UUID,
    "batch_id" INTEGER,
    "device_id" VARCHAR(100),
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "is_corrected" BOOLEAN NOT NULL DEFAULT false,
    "corrected_by" INTEGER,
    "correction_reason" TEXT,
    "is_valid" BOOLEAN NOT NULL DEFAULT true,
    "validation_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tree_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tree_scan_audit" (
    "id" SERIAL NOT NULL,
    "tree_scan_id" INTEGER NOT NULL,
    "changed_by" INTEGER NOT NULL,
    "change_reason" TEXT NOT NULL,
    "old_data" JSONB NOT NULL,
    "new_data" JSONB NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tree_scan_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tree_types" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "key" VARCHAR(200),
    "scientific_name" VARCHAR(200),
    "dry_weight_density" DECIMAL(8,3) NOT NULL DEFAULT 595.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tree_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(300),
    "password_hash" VARCHAR(300),
    "access_token" VARCHAR(100),
    "access_token_created" TIMESTAMP(3),
    "can_sign_in" BOOLEAN NOT NULL DEFAULT true,
    "role" INTEGER NOT NULL,
    "card_id" VARCHAR(80),
    "government_id" VARCHAR(80),
    "gender" VARCHAR(10) DEFAULT 'Male',
    "disability" BOOLEAN NOT NULL DEFAULT false,
    "country_id" INTEGER,
    "admin_location_id" INTEGER,
    "street_address" VARCHAR(500),
    "preferred_language" VARCHAR(10),
    "photo_id" VARCHAR(100),
    "biography" TEXT,
    "notes" TEXT,
    "account_active" BOOLEAN NOT NULL DEFAULT true,
    "date_joined" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_projects" (
    "user_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,

    CONSTRAINT "user_projects_pkey" PRIMARY KEY ("user_id","project_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateIndex
CREATE INDEX "administrative_levels_country_id_idx" ON "administrative_levels"("country_id");

-- CreateIndex
CREATE INDEX "adoptions_adopter_id_idx" ON "adoptions"("adopter_id");

-- CreateIndex
CREATE UNIQUE INDEX "countries_iso2_key" ON "countries"("iso2");

-- CreateIndex
CREATE UNIQUE INDEX "countries_iso3_key" ON "countries"("iso3");

-- CreateIndex
CREATE UNIQUE INDEX "localized_strings_culture_code_string_key_context_key" ON "localized_strings"("culture_code", "string_key", "context");

-- CreateIndex
CREATE INDEX "locations_country_id_idx" ON "locations"("country_id");

-- CreateIndex
CREATE INDEX "locations_parent_id_idx" ON "locations"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "scan_batches_inspector_id_idx" ON "scan_batches"("inspector_id");

-- CreateIndex
CREATE INDEX "scan_batches_project_id_idx" ON "scan_batches"("project_id");

-- CreateIndex
CREATE INDEX "tree_scans_fob_id_idx" ON "tree_scans"("fob_id");

-- CreateIndex
CREATE INDEX "tree_scans_project_id_idx" ON "tree_scans"("project_id");

-- CreateIndex
CREATE INDEX "tree_scans_farmer_id_idx" ON "tree_scans"("farmer_id");

-- CreateIndex
CREATE INDEX "tree_scans_species_id_idx" ON "tree_scans"("species_id");

-- CreateIndex
CREATE INDEX "tree_scans_batch_id_idx" ON "tree_scans"("batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_card_id_key" ON "users"("card_id");

-- AddForeignKey
ALTER TABLE "administrative_levels" ADD CONSTRAINT "administrative_levels_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoptions" ADD CONSTRAINT "adoptions_adopter_id_fkey" FOREIGN KEY ("adopter_id") REFERENCES "adopters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "localized_strings" ADD CONSTRAINT "localized_strings_culture_code_fkey" FOREIGN KEY ("culture_code") REFERENCES "cultures"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tree_types" ADD CONSTRAINT "project_tree_types_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tree_types" ADD CONSTRAINT "project_tree_types_tree_type_id_fkey" FOREIGN KEY ("tree_type_id") REFERENCES "tree_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_batches" ADD CONSTRAINT "scan_batches_inspector_id_fkey" FOREIGN KEY ("inspector_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_batches" ADD CONSTRAINT "scan_batches_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tree_scans" ADD CONSTRAINT "tree_scans_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tree_scans" ADD CONSTRAINT "tree_scans_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tree_scans" ADD CONSTRAINT "tree_scans_inspector_id_fkey" FOREIGN KEY ("inspector_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tree_scans" ADD CONSTRAINT "tree_scans_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "tree_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tree_scans" ADD CONSTRAINT "tree_scans_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "scan_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tree_scans" ADD CONSTRAINT "tree_scans_corrected_by_fkey" FOREIGN KEY ("corrected_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tree_scan_audit" ADD CONSTRAINT "tree_scan_audit_tree_scan_id_fkey" FOREIGN KEY ("tree_scan_id") REFERENCES "tree_scans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tree_scan_audit" ADD CONSTRAINT "tree_scan_audit_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_fkey" FOREIGN KEY ("role") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_projects" ADD CONSTRAINT "user_projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_projects" ADD CONSTRAINT "user_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
