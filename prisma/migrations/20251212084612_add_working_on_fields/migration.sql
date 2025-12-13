-- AlterTable
ALTER TABLE "complaints" ADD COLUMN     "is_working_on" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "working_on_by" TEXT;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_working_on_by_fkey" FOREIGN KEY ("working_on_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
