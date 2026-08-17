-- CreateEnum
CREATE TYPE "TaskList" AS ENUM ('inbox', 'task', 'buylist', 'calendar');

-- CreateTable
CREATE TABLE "tracker_task_items" (
    "id" TEXT NOT NULL,
    "list" "TaskList" NOT NULL DEFAULT 'inbox',
    "text" TEXT NOT NULL,
    "date" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracker_task_items_pkey" PRIMARY KEY ("id")
);
