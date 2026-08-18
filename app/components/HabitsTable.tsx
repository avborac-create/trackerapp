"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DAY_LABELS } from "@/app/lib/dates";
import { CATEGORY_THEME } from "@/app/lib/colors";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type Category,
  type DailyMarkStatus,
  type WeekDTO,
  type WeekNodeDTO,
} from "@/app/lib/types";
import type { WeekStats } from "@/app/lib/stats";
import type { DayBadgeStyle } from "@/app/lib/prefs";
import { DayCell } from "@/app/components/DayCell";

const GRID_COLS = "grid-cols-[128px_repeat(7,32px)_36px]";

type Handlers = {
  editable: boolean;
  badgeStyle: DayBadgeStyle;
  onToggleDay: (weekNodeId: string, day: string) => void;
  onSetDayStatus: (weekNodeId: string, day: string, status: DailyMarkStatus | null) => void;
  onOpenDayNote: (weekNodeId: string, day: string) => void;
  onEditNode: (weekNodeId: string) => void;
  onStopNode: (weekNodeId: string) => void;
};

function TableRow({
  wn,
  weekDays,
  stat,
  ...h
}: Handlers & { wn: WeekNodeDTO; weekDays: string[]; stat: { completed: number; possible: number } }) {
  const theme = CATEGORY_THEME[wn.category];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `agenda-${wn.id}`,
    data: { kind: "agenda", nodeId: wn.nodeId, category: wn.category, title: wn.title },
    disabled: !h.editable,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`grid ${GRID_COLS} items-center gap-1 border-b border-[var(--border-subtle)] py-1.5 last:border-0 ${
        isDragging ? "z-10 opacity-50" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        {h.editable && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label="Sürükle"
            className="shrink-0 cursor-grab touch-none px-0.5 text-[var(--muted)] opacity-50 active:cursor-grabbing"
          >
            ⠿
          </button>
        )}
        <button
          type="button"
          onClick={() => h.onEditNode(wn.nodeId)}
          className="min-w-0 truncate text-left text-[12.5px] text-[var(--foreground)] hover:underline"
        >
          {wn.title}
        </button>
        {h.editable && (
          <button
            type="button"
            onClick={() => h.onStopNode(wn.nodeId)}
            title="Durdur"
            aria-label={`${wn.title} durdur`}
            className="ml-auto shrink-0 rounded-full px-1 text-[10px] text-[var(--muted)] opacity-60 hover:text-[var(--route)] hover:opacity-100"
          >
            ⏸
          </button>
        )}
      </div>

      {weekDays.map((day, i) => {
        const applicable = day >= wn.includedOn && (!wn.removedOn || day <= wn.removedOn);
        return (
          <DayCell
            key={day}
            size="sm"
            applicable={applicable}
            editable={h.editable}
            status={wn.marks[day] ?? null}
            entryCount={wn.dayEntries[day]?.length ?? 0}
            badgeStyle={h.badgeStyle}
            fillClass={theme.fill}
            dayLabel={DAY_LABELS[i]}
            onToggleDone={() => h.onToggleDay(wn.id, day)}
            onSetStatus={(status) => h.onSetDayStatus(wn.id, day, status)}
            onOpenNote={() => h.onOpenDayNote(wn.id, day)}
          />
        );
      })}

      <span className="text-right text-[10px] tabular-nums text-[var(--muted)]">
        {stat.completed}/{stat.possible}
      </span>
    </div>
  );
}

function CategoryGroup({
  category,
  weekNodes,
  weekDays,
  stats,
  collapsed,
  onToggleCollapsed,
  ...h
}: Handlers & {
  category: Category;
  weekNodes: WeekNodeDTO[];
  weekDays: string[];
  stats: WeekStats;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const theme = CATEGORY_THEME[category];
  const { setNodeRef, isOver } = useDroppable({ id: `cluster-${category}`, disabled: !h.editable });

  return (
    <div>
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="flex w-full items-center gap-2 py-2"
        aria-expanded={!collapsed}
        aria-label={`${CATEGORY_LABELS[category]} kümesini ${collapsed ? "aç" : "kapat"}`}
      >
        <span aria-hidden className={`text-[9px] text-[var(--muted)] transition-transform ${collapsed ? "-rotate-90" : ""}`}>
          ▾
        </span>
        <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
        <span className={`text-[11px] font-bold uppercase tracking-wide ${theme.text}`}>{CATEGORY_LABELS[category]}</span>
        {weekNodes.length > 0 && <span className="text-[10px] text-[var(--muted)]">({weekNodes.length})</span>}
      </button>

      <div ref={setNodeRef} className={`rounded-lg transition-colors ${isOver ? "ring-2 ring-inset ring-[var(--compass)]" : ""}`}>
        {(!collapsed || isOver) &&
          (weekNodes.length === 0 ? (
            <p className="pb-2 pl-4 text-[11px] text-[var(--muted)]">{isOver ? "Buraya bırak" : "Bu kümede henüz eylem yok."}</p>
          ) : (
            <SortableContext items={weekNodes.map((wn) => `agenda-${wn.id}`)} strategy={verticalListSortingStrategy}>
              {weekNodes.map((wn) => (
                <TableRow
                  key={wn.id}
                  wn={wn}
                  weekDays={weekDays}
                  stat={stats.nodeStats[wn.id] ?? { weekNodeId: wn.id, completed: 0, possible: 0 }}
                  {...h}
                />
              ))}
            </SortableContext>
          ))}
      </div>
    </div>
  );
}

export function HabitsTable({
  week,
  weekDays,
  stats,
  collapsedMap,
  onToggleCollapsed,
  ...h
}: Handlers & {
  week: WeekDTO;
  weekDays: string[];
  stats: WeekStats;
  collapsedMap: Record<Category, boolean>;
  onToggleCollapsed: (category: Category) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3 backdrop-blur-xl backdrop-saturate-150">
      <div className="min-w-[440px]">
        <div className={`grid ${GRID_COLS} gap-1 border-b border-[var(--border-subtle)] pb-1.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--muted)]`}>
          <span />
          {DAY_LABELS.map((l, i) => (
            <span key={i} className="text-center">
              {l}
            </span>
          ))}
          <span />
        </div>
        {CATEGORY_ORDER.map((cat) => (
          <CategoryGroup
            key={cat}
            category={cat}
            weekNodes={week.weekNodes.filter((wn) => wn.category === cat)}
            weekDays={weekDays}
            stats={stats}
            collapsed={collapsedMap[cat]}
            onToggleCollapsed={() => onToggleCollapsed(cat)}
            {...h}
          />
        ))}
      </div>
    </div>
  );
}
