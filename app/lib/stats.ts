import { DAY_LABELS, getWeekDays } from "@/app/lib/dates";
import { CATEGORY_ORDER, type Category, type WeekDTO, type WeekNodeDTO } from "@/app/lib/types";

export interface NodeStat {
  weekNodeId: string;
  completed: number;
  possible: number;
}

export interface CategoryStat {
  completed: number;
  possible: number;
  percent: number;
}

export interface DayStat {
  day: string;
  label: string;
  count: number;
}

export interface WeekStats {
  totalCompleted: number;
  totalPossible: number;
  percent: number;
  byCategory: Record<Category, CategoryStat>;
  topNode: { title: string; completed: number } | null;
  byDay: DayStat[];
  nodeStats: Record<string, NodeStat>;
}

function possibleDaysFor(weekNode: WeekNodeDTO, weekDays: string[]): string[] {
  const from = weekNode.includedOn;
  const to = weekNode.removedOn ?? weekDays[weekDays.length - 1];
  return weekDays.filter((d) => d >= from && d <= to);
}

export function computeWeekStats(week: WeekDTO): WeekStats {
  const weekDays = getWeekDays(week.startsOn);

  const byCategory: Record<Category, CategoryStat> = {
    companion: { completed: 0, possible: 0, percent: 0 },
    multi: { completed: 0, possible: 0, percent: 0 },
    active: { completed: 0, possible: 0, percent: 0 },
    passive: { completed: 0, possible: 0, percent: 0 },
  };
  const byDay: DayStat[] = weekDays.map((d, i) => ({ day: d, label: DAY_LABELS[i], count: 0 }));
  const nodeStats: Record<string, NodeStat> = {};

  let totalCompleted = 0;
  let totalPossible = 0;
  let topNode: { title: string; completed: number } | null = null;

  for (const wn of week.weekNodes) {
    // "unexpected" (beklenmedik engel) işaretli günler hem payda hem paydan
    // tamamen çıkarılır — o gün hiç "mümkün" değilmiş gibi sayılır.
    const possibleDays = possibleDaysFor(wn, weekDays).filter((d) => wn.marks[d] !== "unexpected");
    let completed = 0;
    for (const d of possibleDays) {
      if (wn.marks[d] === "done") {
        completed += 1;
        const dayEntry = byDay.find((x) => x.day === d);
        if (dayEntry) dayEntry.count += 1;
      }
    }
    const possible = possibleDays.length;

    nodeStats[wn.id] = { weekNodeId: wn.id, completed, possible };

    totalCompleted += completed;
    totalPossible += possible;

    byCategory[wn.category].completed += completed;
    byCategory[wn.category].possible += possible;

    if (!topNode || completed > topNode.completed) {
      topNode = { title: wn.title, completed };
    }
  }

  for (const cat of CATEGORY_ORDER) {
    const c = byCategory[cat];
    c.percent = c.possible > 0 ? Math.round((c.completed / c.possible) * 100) : 0;
  }

  return {
    totalCompleted,
    totalPossible,
    percent: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
    byCategory,
    topNode: topNode && topNode.completed > 0 ? topNode : null,
    byDay,
    nodeStats,
  };
}
