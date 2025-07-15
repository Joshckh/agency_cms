-- AlterTable
ALTER TABLE "commission_rates" ALTER COLUMN "primary_rate" DROP NOT NULL,
ALTER COLUMN "secondary_rate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "can_login" BOOLEAN,
ADD COLUMN     "status" VARCHAR(20);
