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

type Handlers = {
  editable: boolean;
  badgeStyle: DayBadgeStyle;
  onToggleDay: (weekNodeId: string, day: string) => void;
  onSetDayStatus: (weekNodeId: string, day: string, status: DailyMarkStatus | null) => void;
  onOpenDayNote: (weekNodeId: string, day: string) => void;
  onEditNode: (nodeId: string) => void;
  onStopNode: (nodeId: string) => void;
};

function HabitCard({
  wn,
  weekDays,
  stat,
  selectedDay,
  ...h
}: Handlers & {
  wn: WeekNodeDTO;
  weekDays: string[];
  stat: { completed: number; possible: number };
  selectedDay: string | null;
}) {
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
      className={`relative mb-2 overflow-hidden rounded-xl bg-[var(--surface)] py-2 pl-3.5 pr-2.5 last:mb-0 ${
        isDragging ? "z-10 opacity-50" : ""
      }`}
    >
      <span aria-hidden className={`absolute inset-y-0 left-0 w-[3px] ${theme.dot}`} />

      <div className="flex items-start gap-1.5">
        {h.editable && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label="Sürükle"
            className="mt-0.5 shrink-0 cursor-grab touch-none px-0.5 text-[var(--muted)] opacity-50 active:cursor-grabbing"
          >
            ⠿
          </button>
        )}
        <button
          type="button"
          onClick={() => h.onEditNode(wn.nodeId)}
          className="min-w-0 flex-1 text-left text-[12.5px] leading-snug break-words text-[var(--foreground)] hover:underline"
        >
          {wn.title}
        </button>
        <span className="shrink-0 pt-0.5 text-[10px] tabular-nums text-[var(--muted)]">
          {stat.completed}/{stat.possible}
        </span>
        {h.editable && (
          <button
            type="button"
            onClick={() => h.onStopNode(wn.nodeId)}
            title="Durdur"
            aria-label={`${wn.title} durdur`}
            className="shrink-0 rounded-full px-1 text-[10px] text-[var(--muted)] opacity-60 hover:text-[var(--route)] hover:opacity-100"
          >
            ⏸
          </button>
        )}
      </div>

      <div className="mt-2 grid max-w-xs grid-cols-7 gap-1.5">
        {weekDays.map((day, i) => {
          const applicable = day >= wn.includedOn && (!wn.removedOn || day <= wn.removedOn);
          return (
            <div
              key={day}
              className={`rounded-lg ${
                day === selectedDay ? "ring-2 ring-[var(--compass)] ring-offset-1 ring-offset-[var(--surface)]" : ""
              }`}
            >
              <DayCell
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
            </div>
          );
        })}
      </div>
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
  selectedDay,
  ...h
}: Handlers & {
  category: Category;
  weekNodes: WeekNodeDTO[];
  weekDays: string[];
  stats: WeekStats;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  selectedDay: string | null;
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
                <HabitCard
                  key={wn.id}
                  wn={wn}
                  weekDays={weekDays}
                  stat={stats.nodeStats[wn.id] ?? { weekNodeId: wn.id, completed: 0, possible: 0 }}
                  selectedDay={selectedDay}
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
  selectedDay = null,
  ...h
}: Handlers & {
  week: WeekDTO;
  weekDays: string[];
  stats: WeekStats;
  collapsedMap: Record<Category, boolean>;
  onToggleCollapsed: (category: Category) => void;
  selectedDay?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3 backdrop-blur-xl backdrop-saturate-150">
      <div className="mb-1.5 grid max-w-xs grid-cols-7 gap-1.5 pl-3.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        {DAY_LABELS.map((l, i) => (
          <span key={i} className={`text-center ${weekDays[i] === selectedDay ? "text-[var(--compass)]" : ""}`}>
            {l}
          </span>
        ))}
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
          selectedDay={selectedDay}
          {...h}
        />
      ))}
    </div>
  );
}
