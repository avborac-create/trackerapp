"use client";

import { useState } from "react";
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

function StripRow({
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
  const [expanded, setExpanded] = useState(false);
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
      className={`rounded-xl bg-[var(--surface-2)] transition-colors ${isDragging ? "z-10 opacity-50" : ""} ${
        expanded ? "border border-[var(--border-strong)]" : ""
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        {h.editable && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label="Sürükle"
            className="shrink-0 cursor-grab touch-none text-[var(--muted)] opacity-50 active:cursor-grabbing"
          >
            ⠿
          </button>
        )}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={expanded}
        >
          <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${theme.dot}`} />
          <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--foreground)]">{wn.title}</span>
        </button>

        {!expanded && (
          <div className="flex shrink-0 gap-[2px]" aria-hidden>
            {weekDays.map((day) => {
              const done = wn.marks[day] === "done";
              const status = wn.marks[day];
              return (
                <span
                  key={day}
                  className={`h-3.5 w-2 rounded-sm ${
                    done
                      ? theme.fill
                      : status === "unexpected"
                        ? "bg-amber-500/60"
                        : status === "neglected"
                          ? "bg-rose-500/60"
                          : "bg-[var(--border-strong)]"
                  } ${day === selectedDay ? "ring-2 ring-[var(--compass)]" : ""}`}
                />
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex shrink-0 items-center gap-1 text-[10px] text-[var(--muted)]"
        >
          <span className="tabular-nums">
            {stat.completed}/{stat.possible}
          </span>
          <span aria-hidden className={`transition-transform ${expanded ? "rotate-90" : ""}`}>
            ›
          </span>
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3">
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((day, i) => {
              const applicable = day >= wn.includedOn && (!wn.removedOn || day <= wn.removedOn);
              return (
                <div
                  key={day}
                  className={`rounded-lg ${
                    day === selectedDay ? "ring-2 ring-[var(--compass)] ring-offset-1 ring-offset-[var(--surface-2)]" : ""
                  }`}
                >
                  <DayCell
                    size="lg"
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

          {wn.notes && (
            <p className={`mt-2.5 whitespace-pre-wrap rounded-lg border p-2.5 text-xs leading-relaxed text-[var(--foreground)] ${theme.softBg} ${theme.softBorder}`}>
              {wn.notes}
            </p>
          )}

          <div className="mt-2.5 flex items-center gap-3">
            <button type="button" onClick={() => h.onEditNode(wn.nodeId)} className="text-[11px] font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:underline">
              Düzenle
            </button>
            {h.editable && (
              <button type="button" onClick={() => h.onStopNode(wn.nodeId)} className="text-[11px] font-medium text-[var(--muted)] hover:text-[var(--route)]">
                Durdur
              </button>
            )}
          </div>
        </div>
      )}
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
        <span aria-hidden className={`h-2 w-2 rounded-full ${theme.dot}`} />
        <span className={`font-display text-base tracking-wide ${theme.text}`}>{CATEGORY_LABELS[category]}</span>
        {weekNodes.length > 0 && <span className="text-xs text-[var(--muted)]">({weekNodes.length})</span>}
      </button>

      <div ref={setNodeRef} className={`space-y-1.5 rounded-lg transition-colors ${isOver ? "ring-2 ring-inset ring-[var(--compass)]" : ""}`}>
        {(!collapsed || isOver) &&
          (weekNodes.length === 0 ? (
            <p className="pb-2 pl-1 text-xs text-[var(--muted)]">{isOver ? "Buraya bırak" : "Bu kümede henüz eylem yok."}</p>
          ) : (
            <SortableContext items={weekNodes.map((wn) => `agenda-${wn.id}`)} strategy={verticalListSortingStrategy}>
              {weekNodes.map((wn) => (
                <StripRow
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

export function HabitsStrip({
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
    <div className="space-y-3">
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
