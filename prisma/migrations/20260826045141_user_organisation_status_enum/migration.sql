/*
  Note:
  - changing status entry in user_organisation from String to enum of "invited" "active" and "suspended"
  - backdrop by matching lowercase string to the enum
  - if no match, default to active

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('invited', 'active', 'suspended');

-- BACKDROPPING DATA:
-- create nullable Status column
ALTER TABLE "user_organisations" ADD COLUMN "status_new" "Status";

UPDATE "user_organisations"
SET "status_new" = CASE 
    WHEN LOWER("status") = 'invited'    THEN 'invited'::"Status"
    WHEN LOWER("status") = 'active'     THEN 'active'::"Status"
    WHEN LOWER("status") = 'suspended'  THEN 'suspended'::"Status"
    ELSE 'active'::"Status"  -- fallback for any non-matching string
END;

-- drop the string status column, and rename new column
ALTER TABLE "user_organisations" DROP COLUMN "status";
ALTER TABLE "user_organisations" RENAME COLUMN "status_new" TO "status";

-- AlterTable
ALTER TABLE "user_organisations" ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'active';