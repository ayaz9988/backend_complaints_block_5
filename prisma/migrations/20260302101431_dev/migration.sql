/*
  Warnings:

  - You are about to drop the column `iconUrl` on the `Achievement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Achievement" DROP COLUMN "iconUrl",
ADD COLUMN     "mediaType" TEXT,
ADD COLUMN     "mediaUrl" TEXT;

-- AlterTable
ALTER TABLE "Initiative" ADD COLUMN     "mediaType" TEXT,
ADD COLUMN     "mediaUrl" TEXT;

-- AlterTable
ALTER TABLE "complaints" ADD COLUMN     "mediaType" TEXT,
ADD COLUMN     "mediaUrl" TEXT;
