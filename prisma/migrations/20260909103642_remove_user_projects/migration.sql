/*
  Warnings:

  - You are about to drop the `user_projects` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "user_projects" DROP CONSTRAINT "user_projects_project_id_fkey";

-- DropForeignKey
ALTER TABLE "user_projects" DROP CONSTRAINT "user_projects_user_id_fkey";

-- DropTable
DROP TABLE "user_projects";
