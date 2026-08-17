-- CreateTable
CREATE TABLE "tracker_task_sections" (
    "id" TEXT NOT NULL,
    "list" "TaskList" NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracker_task_sections_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "tracker_task_items" ADD COLUMN "sectionId" TEXT;

-- AddForeignKey
ALTER TABLE "tracker_task_items" ADD CONSTRAINT "tracker_task_items_sectionId_fkey"
    FOREIGN KEY ("sectionId") REFERENCES "tracker_task_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Calendar artık ayrı bir liste değil: mevcut "calendar" listesindeki öğeleri
-- "task" listesine taşı, tarihleri (date) korunur.
UPDATE "tracker_task_items" SET "list" = 'task' WHERE "list" = 'calendar';
