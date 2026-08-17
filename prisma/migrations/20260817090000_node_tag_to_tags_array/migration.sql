-- Convert single "tag" column to a "tags" text array so a Multi node can carry
-- more than one context tag (e.g. "hastane", "haciz", "araba" at once).
ALTER TABLE "tracker_nodes" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT '{}';

UPDATE "tracker_nodes" SET "tags" = ARRAY["tag"] WHERE "tag" IS NOT NULL AND "tag" <> '';

ALTER TABLE "tracker_nodes" DROP COLUMN "tag";
