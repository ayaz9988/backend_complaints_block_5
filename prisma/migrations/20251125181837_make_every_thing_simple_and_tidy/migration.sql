/*
  Warnings:

  - You are about to drop the column `createdAt` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `jti` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `sortOrder` on the `complaint_statuses` table. All the data in the column will be lost.
  - You are about to drop the column `canUserProvideSolution` on the `complaints` table. All the data in the column will be lost.
  - You are about to drop the column `trackingCode` on the `complaints` table. All the data in the column will be lost.
  - You are about to drop the `_achievementsTocomplaint_attachments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `achievements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `announcements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `complaint_attachments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `complaint_timeline` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mukhtar_assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notifications_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `system_settings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_achievementsTocomplaint_attachments" DROP CONSTRAINT "_achievementsTocomplaint_attachments_A_fkey";

-- DropForeignKey
ALTER TABLE "_achievementsTocomplaint_attachments" DROP CONSTRAINT "_achievementsTocomplaint_attachments_B_fkey";

-- DropForeignKey
ALTER TABLE "achievements" DROP CONSTRAINT "achievements_afterAttachmentId_fkey";

-- DropForeignKey
ALTER TABLE "achievements" DROP CONSTRAINT "achievements_beforeAttachmentId_fkey";

-- DropForeignKey
ALTER TABLE "achievements" DROP CONSTRAINT "achievements_complaintId_fkey";

-- DropForeignKey
ALTER TABLE "achievements" DROP CONSTRAINT "achievements_createdById_fkey";

-- DropForeignKey
ALTER TABLE "announcements" DROP CONSTRAINT "announcements_createdById_fkey";

-- DropForeignKey
ALTER TABLE "complaint_attachments" DROP CONSTRAINT "complaint_attachments_complaintId_fkey";

-- DropForeignKey
ALTER TABLE "complaint_timeline" DROP CONSTRAINT "complaint_timeline_actorId_fkey";

-- DropForeignKey
ALTER TABLE "complaint_timeline" DROP CONSTRAINT "complaint_timeline_complaintId_fkey";

-- DropForeignKey
ALTER TABLE "complaint_timeline" DROP CONSTRAINT "complaint_timeline_statusId_fkey";

-- DropForeignKey
ALTER TABLE "mukhtar_assignments" DROP CONSTRAINT "mukhtar_assignments_assignedById_fkey";

-- DropForeignKey
ALTER TABLE "mukhtar_assignments" DROP CONSTRAINT "mukhtar_assignments_complaintId_fkey";

-- DropForeignKey
ALTER TABLE "mukhtar_assignments" DROP CONSTRAINT "mukhtar_assignments_mukhtarId_fkey";

-- DropForeignKey
ALTER TABLE "notifications_log" DROP CONSTRAINT "notifications_log_complaintId_fkey";

-- DropIndex
DROP INDEX "RefreshToken_jti_key";

-- DropIndex
DROP INDEX "complaints_trackingCode_key";

-- AlterTable
ALTER TABLE "RefreshToken" DROP COLUMN "createdAt",
DROP COLUMN "jti";

-- AlterTable
ALTER TABLE "complaint_statuses" DROP COLUMN "sortOrder";

-- AlterTable
ALTER TABLE "complaints" DROP COLUMN "canUserProvideSolution",
DROP COLUMN "trackingCode",
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "_achievementsTocomplaint_attachments";

-- DropTable
DROP TABLE "achievements";

-- DropTable
DROP TABLE "announcements";

-- DropTable
DROP TABLE "complaint_attachments";

-- DropTable
DROP TABLE "complaint_timeline";

-- DropTable
DROP TABLE "mukhtar_assignments";

-- DropTable
DROP TABLE "notifications_log";

-- DropTable
DROP TABLE "system_settings";
