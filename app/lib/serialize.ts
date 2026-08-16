import { utcDateToISO } from "@/app/lib/dates";
import type { NodeDTO, WeekDTO, WeekNodeDTO } from "@/app/lib/types";

type WeekNodeWithRelations = {
  id: string;
  nodeId: string;
  categorySnapshot: string;
  includedOn: Date;
  removedOn: Date | null;
  sortOrder: number;
  node: { title: string };
  dailyMarks: { day: Date; completed: boolean }[];
};

type WeekWithRelations = {
  id: string;
  startsOn: Date;
  endsOn: Date;
  state: string;
  weekNodes: WeekNodeWithRelations[];
};

export function toWeekNodeDTO(wn: WeekNodeWithRelations): WeekNodeDTO {
  const marks: Record<string, boolean> = {};
  for (const m of wn.dailyMarks) {
    marks[utcDateToISO(m.day)] = m.completed;
  }
  return {
    id: wn.id,
    nodeId: wn.nodeId,
    title: wn.node.title,
    category: wn.categorySnapshot as WeekNodeDTO["category"],
    includedOn: utcDateToISO(wn.includedOn),
    removedOn: wn.removedOn ? utcDateToISO(wn.removedOn) : null,
    sortOrder: wn.sortOrder,
    marks,
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
  createdAt: Date;
}): NodeDTO {
  return {
    id: node.id,
    title: node.title,
    category: node.category as NodeDTO["category"],
    externalStatus: node.externalStatus as NodeDTO["externalStatus"],
    createdAt: node.createdAt.toISOString(),
  };
}
