import { utcDateToISO } from "@/app/lib/dates";
import type { DailyMarkStatus, NodeDTO, WeekDTO, WeekNodeDTO } from "@/app/lib/types";

type WeekNodeWithRelations = {
  id: string;
  nodeId: string;
  categorySnapshot: string;
  includedOn: Date;
  removedOn: Date | null;
  sortOrder: number;
  node: { title: string; notes: string | null; tags: string[] };
  dailyMarks: {
    day: Date;
    status: string | null;
    entries: { id: string; text: string }[];
  }[];
};

type WeekWithRelations = {
  id: string;
  startsOn: Date;
  endsOn: Date;
  state: string;
  weekNodes: WeekNodeWithRelations[];
};

export function toWeekNodeDTO(wn: WeekNodeWithRelations): WeekNodeDTO {
  const marks: Record<string, DailyMarkStatus> = {};
  const dayEntries: Record<string, { id: string; text: string }[]> = {};
  for (const m of wn.dailyMarks) {
    const iso = utcDateToISO(m.day);
    if (m.status) marks[iso] = m.status as DailyMarkStatus;
    if (m.entries.length > 0) dayEntries[iso] = m.entries;
  }
  return {
    id: wn.id,
    nodeId: wn.nodeId,
    title: wn.node.title,
    category: wn.categorySnapshot as WeekNodeDTO["category"],
    notes: wn.node.notes,
    tags: wn.node.tags,
    includedOn: utcDateToISO(wn.includedOn),
    removedOn: wn.removedOn ? utcDateToISO(wn.removedOn) : null,
    sortOrder: wn.sortOrder,
    marks,
    dayEntries,
  };
}

export function toWeekDTO(week: WeekWithRelations): WeekDTO {
  return {
    id: week.id,
    startsOn: utcDateToISO(week.startsOn),
    endsOn: utcDateToISO(week.endsOn),
    state: week.state as WeekDTO["state"],
    weekNodes: week.weekNodes.map(toWeekNodeDTO),
  };
}

export function toNodeDTO(node: {
  id: string;
  title: string;
  category: string;
  externalStatus: string;
  notes: string | null;
  tags: string[];
  createdAt: Date;
}): NodeDTO {
  return {
    id: node.id,
    title: node.title,
    category: node.category as NodeDTO["category"],
    externalStatus: node.externalStatus as NodeDTO["externalStatus"],
    notes: node.notes,
    tags: node.tags,
    createdAt: node.createdAt.toISOString(),
  };
}
