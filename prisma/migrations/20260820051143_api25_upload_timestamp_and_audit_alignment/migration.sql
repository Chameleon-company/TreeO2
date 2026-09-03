/*
  Notes:

  - `upload_timestamp` is added to `tree_scans` with a default, so it is safe to
    add to a populated table and needs no backfill (V1.2 7.20, server controlled
    per V1.2 10.5).
  - `change_type` is added to `tree_scan_audit` as a required column (V1.2 7.21),
    typed as the `tree_scan_audit_change_type` enum so the DB rejects any value
    outside the spec's closed set. Because a NOT NULL column with no default
    aborts on a populated table, it is added nullable, backfilled, then set NOT
    NULL. Existing audit rows are all produced by the tree scan correction flow,
    so they are backfilled as 'corrected'.
  - `change_reason` and `old_data` are relaxed to nullable to match V1.2 7.21,
    which specifies them as NULL. Relaxing a constraint cannot fail on existing
    data.
*/

-- AlterTable
ALTER TABLE "tree_scans" ADD COLUMN     "upload_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateEnum: closed set of audit change types (V1.2 7.21)
CREATE TYPE "tree_scan_audit_change_type" AS ENUM ('created', 'corrected', 'archived', 'validated');

-- Add change_type safely: adding a NOT NULL column with no default aborts on a
-- table that already has rows. Add it nullable, backfill existing rows, then
-- enforce NOT NULL.
ALTER TABLE "tree_scan_audit" ADD COLUMN     "change_type" "tree_scan_audit_change_type";
UPDATE "tree_scan_audit" SET "change_type" = 'corrected' WHERE "change_type" IS NULL;
ALTER TABLE "tree_scan_audit" ALTER COLUMN "change_type" SET NOT NULL;

-- AlterTable: match V1.2 7.21, which specifies these columns as NULL
ALTER TABLE "tree_scan_audit" ALTER COLUMN "change_reason" DROP NOT NULL;
ALTER TABLE "tree_scan_audit" ALTER COLUMN "old_data" DROP NOT NULL;
