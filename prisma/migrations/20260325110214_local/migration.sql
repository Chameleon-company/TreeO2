-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FARMER', 'INSPECTOR', 'MANAGER', 'ADMIN', 'DEVELOPER');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'FARMER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "preferredLanguage" VARCHAR(10),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
