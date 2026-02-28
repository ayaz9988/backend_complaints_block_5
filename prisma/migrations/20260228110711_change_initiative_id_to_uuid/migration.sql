/*
  Warnings:

  - The primary key for the `Initiative` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Initiative" DROP CONSTRAINT "Initiative_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Initiative_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Initiative_id_seq";
