-- AlterTable
ALTER TABLE "adopters" ADD COLUMN     "partner_id" INTEGER;

-- AlterTable
ALTER TABLE "adoptions" ADD COLUMN     "cancellation_reason" TEXT,
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "project_id" INTEGER;

-- AlterTable
ALTER TABLE "localized_strings" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable with temporary default NOW() for backfilling
ALTER TABLE "localized_strings" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW();
-- Remove the default so future rows must set it explicitly
ALTER TABLE "localized_strings" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "scans_enabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "tree_types" ADD COLUMN     "max_diameter_cm" DECIMAL(12,3),
ADD COLUMN     "max_height_m" DECIMAL(12,3),
ADD COLUMN     "min_diameter_cm" DECIMAL(12,3),
ADD COLUMN     "min_height_m" DECIMAL(12,3),
ALTER COLUMN "dry_weight_density" DROP NOT NULL,
ALTER COLUMN "dry_weight_density" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "adopters" ADD CONSTRAINT "adopters_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoptions" ADD CONSTRAINT "adoptions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
