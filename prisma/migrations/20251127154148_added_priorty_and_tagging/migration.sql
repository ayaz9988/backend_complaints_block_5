/*
  Warnings:

  - You are about to drop the column `complaintStatusId` on the `complaints` table. All the data in the column will be lost.
  - You are about to drop the column `complaintTypeId` on the `complaints` table. All the data in the column will be lost.
  - You are about to drop the column `neighborhoodId` on the `complaints` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[trackingTag]` on the table `complaints` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `trackingTag` to the `complaints` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('high', 'mid', 'low');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "neighborhood" TEXT,
ALTER COLUMN "is_active" SET DEFAULT true;

-- AlterTable
ALTER TABLE "complaints" DROP COLUMN "complaintStatusId",
DROP COLUMN "complaintTypeId",
DROP COLUMN "neighborhoodId",
ADD COLUMN     "estimatedReviewTime" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'mid',
ADD COLUMN     "refusalReason" TEXT,
ADD COLUMN     "solutionInfo" TEXT,
ADD COLUMN     "trackingTag" TEXT NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "complaint_status" SET DEFAULT 'pending';

-- CreateIndex
CREATE UNIQUE INDEX "complaints_trackingTag_key" ON "complaints"("trackingTag");
