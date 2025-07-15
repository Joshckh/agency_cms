-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('primary', 'secondary');

-- AlterTable
ALTER TABLE "commissions" ADD COLUMN     "commission_type" "CommissionType" NOT NULL DEFAULT 'primary';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "recruiter_id" INTEGER DEFAULT 1;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
