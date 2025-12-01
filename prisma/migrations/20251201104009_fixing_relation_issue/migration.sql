-- DropForeignKey
ALTER TABLE "Achievement" DROP CONSTRAINT "Achievement_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Announcement" DROP CONSTRAINT "Announcement_createdBy_fkey";

-- AlterTable
ALTER TABLE "Achievement" ALTER COLUMN "createdBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Announcement" ALTER COLUMN "createdBy" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
