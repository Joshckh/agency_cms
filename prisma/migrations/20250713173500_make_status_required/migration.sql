/*
  Warnings:

  - Made the column `can_login` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "can_login" SET NOT NULL,
ALTER COLUMN "can_login" SET DEFAULT true,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'active',
ALTER COLUMN "status" SET DATA TYPE TEXT;
