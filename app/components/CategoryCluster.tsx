"use client";

import { NodeCard } from "@/app/components/NodeCard";
import { CATEGORY_LABELS, type Category, type WeekNodeDTO } from "@/app/lib/types";
import type { WeekStats } from "@/app/lib/stats";

export function CategoryCluster({
  category,
  weekNodes,
  weekDays,
  stats,
  editable,
  onToggleDay,
  onEditNode,
}: {
  category: Category;
  weekNodes: WeekNodeDTO[];
  weekDays: string[];
  stats: WeekStats;
  editable: boolean;
  onToggleDay: (weekNodeId: string, day: string) => void;
  onEditNode: (weekNodeId: string) => void;
}) {
  const catStat = stats.byCategory[category];

  return (
    <section className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-neutral-600 dark:text-neutral-300">
          {CATEGORY_LABELS[category]}
        </h2>
        {catStat.possible > 0 && (
          <span className="text-xs tabular-nums text-neutral-400">{catStat.percent}%</span>
        )}
      </div>

      {weekNodes.length === 0 ? (
        <p className="text-xs text-neutral-400">Bu kümede henüz düğüm yok.</p>
      ) : (
        <div className="space-y-2.5">
          {weekNodes.map((wn) => (
            <NodeCard
              key={wn.id}
              weekNode={wn}
              weekDays={weekDays}
              stat={stats.nodeStats[wn.id] ?? { weekNodeId: wn.id, completed: 0, possible: 0 }}
              editable={editable}
              onToggleDay={(day) => onToggleDay(wn.id, day)}
              onEdit={() => onEditNode(wn.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
