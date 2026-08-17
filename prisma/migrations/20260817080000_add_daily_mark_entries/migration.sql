-- CreateTable
CREATE TABLE "tracker_daily_mark_entries" (
    "id" TEXT NOT NULL,
    "dailyMarkId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracker_daily_mark_entries_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tracker_daily_mark_entries" ADD CONSTRAINT "tracker_daily_mark_entries_dailyMarkId_fkey" FOREIGN KEY ("dailyMarkId") REFERENCES "tracker_daily_marks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing single note values into the new entries table
INSERT INTO "tracker_daily_mark_entries" ("id", "dailyMarkId", "text", "createdAt")
SELECT gen_random_uuid()::text, "id", "note", "updatedAt"
FROM "tracker_daily_marks"
WHERE "note" IS NOT NULL;

-- DropColumn
ALTER TABLE "tracker_daily_marks" DROP COLUMN "note";
