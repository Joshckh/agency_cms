/*
  Warnings:

  - You are about to drop the column `commission_type` on the `commission_rates` table. All the data in the column will be lost.
  - You are about to drop the column `rate` on the `commission_rates` table. All the data in the column will be lost.
  - Added the required column `primary_rate` to the `commission_rates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `secondary_rate` to the `commission_rates` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "commission_rates" DROP CONSTRAINT "commission_rates_rank_id_fkey";

-- AlterTable
ALTER TABLE "commission_rates" DROP COLUMN "commission_type",
DROP COLUMN "rate",
ADD COLUMN     "primary_rate" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "secondary_rate" DECIMAL(5,2) NOT NULL;

-- AddForeignKey
ALTER TABLE "commission_rates" ADD CONSTRAINT "commission_rates_rank_id_fkey" FOREIGN KEY ("rank_id") REFERENCES "ranks"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
