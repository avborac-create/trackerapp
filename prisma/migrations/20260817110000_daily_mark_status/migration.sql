-- CreateEnum
CREATE TYPE "DailyMarkStatus" AS ENUM ('done', 'unexpected', 'neglected');

-- AlterTable: replace boolean "completed" with nullable "status" enum, preserving data
ALTER TABLE "tracker_daily_marks" ADD COLUMN "status" "DailyMarkStatus";
UPDATE "tracker_daily_marks" SET "status" = 'done' WHERE "completed" = true;
ALTER TABLE "tracker_daily_marks" DROP COLUMN "completed";
