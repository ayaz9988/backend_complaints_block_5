/*
  Warnings:

  - You are about to drop the column `isPublic` on the `announcements` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `complaint_types` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `complaint_types` table. All the data in the column will be lost.
  - You are about to drop the column `addressText` on the `complaints` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `complaints` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `complaints` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `neighborhoods` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "announcements" DROP COLUMN "isPublic";

-- AlterTable
ALTER TABLE "complaint_types" DROP COLUMN "description",
DROP COLUMN "isActive";

-- AlterTable
ALTER TABLE "complaints" DROP COLUMN "addressText",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "neighborhoods" DROP COLUMN "description";
