/*
  Warnings:

  - You are about to drop the `complaint_statuses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `complaint_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `neighborhoods` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[complaint_type]` on the table `complaints` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[neighborhood]` on the table `complaints` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `complaint_status` to the `complaints` table without a default value. This is not possible if the table is not empty.
  - Added the required column `complaint_type` to the `complaints` table without a default value. This is not possible if the table is not empty.
  - Added the required column `neighborhood` to the `complaints` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('pending', 'accepted', 'refused');

-- DropForeignKey
ALTER TABLE "complaints" DROP CONSTRAINT "complaints_complaintStatusId_fkey";

-- DropForeignKey
ALTER TABLE "complaints" DROP CONSTRAINT "complaints_complaintTypeId_fkey";

-- DropForeignKey
ALTER TABLE "complaints" DROP CONSTRAINT "complaints_neighborhoodId_fkey";

-- AlterTable
ALTER TABLE "complaints" ADD COLUMN     "complaint_status" "Status" NOT NULL,
ADD COLUMN     "complaint_type" TEXT NOT NULL,
ADD COLUMN     "neighborhood" TEXT NOT NULL;

-- DropTable
DROP TABLE "complaint_statuses";

-- DropTable
DROP TABLE "complaint_types";

-- DropTable
DROP TABLE "neighborhoods";

-- CreateIndex
CREATE UNIQUE INDEX "complaints_complaint_type_key" ON "complaints"("complaint_type");

-- CreateIndex
CREATE UNIQUE INDEX "complaints_neighborhood_key" ON "complaints"("neighborhood");
