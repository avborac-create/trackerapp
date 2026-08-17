"use client";

import { useDroppable } from "@dnd-kit/core";
import { NodeCard } from "@/app/components/NodeCard";
import { CATEGORY_THEME } from "@/app/lib/colors";
import { CATEGORY_LABELS, type Category, type DailyMarkStatus, type WeekNodeDTO } from "@/app/lib/types";
import type { WeekStats } from "@/app/lib/stats";

export function CategoryCluster({
  category,
  weekNodes,
  weekDays,
  stats,
  editable,
  collapsed,
  onToggleCollapsed,
  onToggleDay,
  onSetDayStatus,
  onOpenDayNote,
  onEditNode,
  onStopNode,
}: {
  category: Category;
  weekNodes: WeekNodeDTO[];
  weekDays: string[];
  stats: WeekStats;
  editable: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onToggleDay: (weekNodeId: string, day: string) => void;
  onSetDayStatus: (weekNodeId: string, day: string, status: DailyMarkStatus | null) => void;
  onOpenDayNote: (weekNodeId: string, day: string) => void;
  onEditNode: (weekNodeId: string) => void;
  onStopNode: (weekNodeId: string) => void;
}) {
  const catStat = stats.byCategory[category];
  const theme = CATEGORY_THEME[category];
  const { setNodeRef, isOver } = useDroppable({ id: `cluster-${category}`, disabled: !editable });

  return (
    <section
      ref={setNodeRef}
      className={`rounded-xl border backdrop-blur-xl backdrop-saturate-150 transition-colors ${theme.softBorder} ${theme.softBg} ${
        isOver ? `ring-2 ${theme.ring}` : ""
      }`}
    >
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="flex w-full items-center justify-between px-3 py-2.5"
        aria-expanded={!collapsed}
        aria-label={`${CATEGORY_LABELS[category]} kümesini ${collapsed ? "aç" : "kapat"}`}
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className={`text-[10px] text-[var(--muted)] transition-transform ${collapsed ? "-rotate-90" : ""}`}
          >
            ▾
          </span>
          <span className={`h-2 w-2 rounded-full ${theme.dot}`} aria-hidden />
          <h2 className={`font-display text-base tracking-wide ${theme.text}`}>
            {CATEGORY_LABELS[category]}
          </h2>
          {weekNodes.length > 0 && (
            <span className="text-xs text-[var(--muted)]">({weekNodes.length})</span>
          )}
        </div>
        {catStat.possible > 0 && (
          <span className="text-xs font-medium tabular-nums text-[var(--muted)]">
            {catStat.percent}%
          </span>
        )}
      </button>

      {(!collapsed || isOver) && (
        <div className="px-3 pb-3">
          {weekNodes.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">
              {isOver ? "Buraya bırak" : "Bu kümede henüz eylem yok."}
            </p>
          ) : (
            <div className="space-y-2">
              {weekNodes.map((wn) => (
                <NodeCard
                  key={wn.id}
                  weekNode={wn}
                  weekDays={weekDays}
                  stat={stats.nodeStats[wn.id] ?? { weekNodeId: wn.id, completed: 0, possible: 0 }}
                  editable={editable}
                  onToggleDay={(day) => onToggleDay(wn.id, day)}
                  onSetDayStatus={(day, status) => onSetDayStatus(wn.id, day, status)}
                  onOpenDayNote={(day) => onOpenDayNote(wn.id, day)}
                  onEdit={() => onEditNode(wn.id)}
                  onStop={() => onStopNode(wn.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
