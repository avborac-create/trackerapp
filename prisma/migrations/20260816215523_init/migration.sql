-- CreateTable
CREATE TABLE "tracker_nodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'active',
    "externalStatus" TEXT NOT NULL DEFAULT 'inbox',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tracker_weeks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startsOn" DATETIME NOT NULL,
    "endsOn" DATETIME NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME
);

-- CreateTable
CREATE TABLE "tracker_week_nodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "categorySnapshot" TEXT NOT NULL,
    "includedOn" DATETIME NOT NULL,
    "removedOn" DATETIME,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "tracker_week_nodes_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "tracker_weeks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tracker_week_nodes_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "tracker_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tracker_daily_marks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekNodeId" TEXT NOT NULL,
    "day" DATETIME NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tracker_daily_marks_weekNodeId_fkey" FOREIGN KEY ("weekNodeId") REFERENCES "tracker_week_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "tracker_week_nodes_weekId_nodeId_key" ON "tracker_week_nodes"("weekId", "nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "tracker_daily_marks_weekNodeId_day_key" ON "tracker_daily_marks"("weekNodeId", "day");
