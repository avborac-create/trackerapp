-- CreateEnum
CREATE TYPE "Category" AS ENUM ('companion', 'multi', 'active', 'passive');

-- CreateEnum
CREATE TYPE "ExternalStatus" AS ENUM ('inbox', 'not_now', 'on_agenda', 'closed');

-- CreateEnum
CREATE TYPE "WeekState" AS ENUM ('open', 'closed');

-- CreateTable
CREATE TABLE "tracker_nodes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "Category" NOT NULL DEFAULT 'active',
    "externalStatus" "ExternalStatus" NOT NULL DEFAULT 'inbox',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracker_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracker_weeks" (
    "id" TEXT NOT NULL,
    "startsOn" TIMESTAMP(3) NOT NULL,
    "endsOn" TIMESTAMP(3) NOT NULL,
    "state" "WeekState" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "tracker_weeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracker_week_nodes" (
    "id" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "categorySnapshot" "Category" NOT NULL,
    "includedOn" TIMESTAMP(3) NOT NULL,
    "removedOn" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tracker_week_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracker_daily_marks" (
    "id" TEXT NOT NULL,
    "weekNodeId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracker_daily_marks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tracker_week_nodes_weekId_nodeId_key" ON "tracker_week_nodes"("weekId", "nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "tracker_daily_marks_weekNodeId_day_key" ON "tracker_daily_marks"("weekNodeId", "day");

-- AddForeignKey
ALTER TABLE "tracker_week_nodes" ADD CONSTRAINT "tracker_week_nodes_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "tracker_weeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracker_week_nodes" ADD CONSTRAINT "tracker_week_nodes_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "tracker_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracker_daily_marks" ADD CONSTRAINT "tracker_daily_marks_weekNodeId_fkey" FOREIGN KEY ("weekNodeId") REFERENCES "tracker_week_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
