"use client";

import { useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { DAY_LABELS } from "@/app/lib/dates";
import { CATEGORY_THEME } from "@/app/lib/colors";
import { DAILY_MARK_STATUS_LABELS, type DailyMarkStatus, type WeekNodeDTO } from "@/app/lib/types";
import type { NodeStat } from "@/app/lib/stats";

const STATUS_PICKS: { status: DailyMarkStatus | null; icon: string }[] = [
  { status: "done", icon: "✓" },
  { status: "unexpected", icon: "⚠" },
  { status: "neglected", icon: "✕" },
  { status: null, icon: "○" },
];

const LONG_PRESS_MS = 450;

export function NodeCard({
  weekNode,
  weekDays,
  stat,
  editable,
  onToggleDay,
  onSetDayStatus,
  onOpenDayNote,
  onEdit,
  onStop,
}: {
  weekNode: WeekNodeDTO;
  weekDays: string[];
  stat: NodeStat;
  editable: boolean;
  onToggleDay: (day: string) => void;
  onSetDayStatus: (day: string, status: DailyMarkStatus | null) => void;
  onOpenDayNote: (day: string) => void;
  onEdit: () => void;
  onStop: () => void;
}) {
  const theme = CATEGORY_THEME[weekNode.category];
  const [readMeOpen, setReadMeOpen] = useState(false);
  const [pickerDay, setPickerDay] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  function startLongPress(day: string) {
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setPickerDay(day);
    }, LONG_PRESS_MS);
  }

  function cancelLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  }

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `agenda-${weekNode.id}`,
    data: { kind: "agenda", nodeId: weekNode.nodeId, category: weekNode.category, title: weekNode.title },
    disabled: !editable,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`group rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-2 shadow-sm backdrop-blur-xl backdrop-saturate-150 transition-shadow hover:shadow-md ${
        isDragging ? "z-50 opacity-50 shadow-lg" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {editable && (
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="shrink-0 cursor-grab touch-none px-0.5 text-[var(--muted)] opacity-60 active:cursor-grabbing"
              aria-label="Sürükle"
              title="Sürükleyerek taşı"
            >
              ⠿
            </button>
          )}
          <button
            type="button"
            onClick={onEdit}
            className="flex flex-wrap items-center gap-1.5 text-left text-sm font-medium text-[var(--foreground)] hover:underline"
          >
            {weekNode.title}
            {weekNode.tags.map((tag) => (
              <span
                key={tag}
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-normal no-underline ${theme.chipBg} ${theme.text}`}
              >
                {tag}
              </span>
            ))}
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${theme.chipBg} ${theme.text}`}
          >
            {stat.completed}/{stat.possible}
          </span>
          {editable && (
            <button
              type="button"
              onClick={onStop}
              title="Gündemden çıkar, Durduruldu'ya taşı"
              className="rounded-full px-1.5 py-0.5 text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--route)]"
            >
              Durdur
            </button>
          )}
        </div>
      </div>

      <div className="mt-1.5 grid grid-cols-7 gap-1">
        {weekDays.map((day, i) => {
          const applicable = day >= weekNode.includedOn && (!weekNode.removedOn || day <= weekNode.removedOn);
          const status = weekNode.marks[day] ?? null;
          const entryCount = weekNode.dayEntries[day]?.length ?? 0;
          const statusIcon = status === "done" ? "✓" : status === "unexpected" ? "⚠" : status === "neglected" ? "✕" : "○";
          const statusClass =
            status === "done"
              ? `${theme.fill} text-white shadow-sm`
              : status === "unexpected"
                ? "bg-amber-500 text-white shadow-sm"
                : status === "neglected"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--muted)] hover:border-[var(--border-strong)]";
          return (
            <div key={day} className="relative">
              <button
                type="button"
                disabled={!editable || !applicable}
                onClick={() => {
                  if (longPressFired.current) return;
                  onToggleDay(day);
                }}
                onPointerDown={() => applicable && editable && startLongPress(day)}
                onPointerUp={cancelLongPress}
                onPointerLeave={cancelLongPress}
                onPointerCancel={cancelLongPress}
                aria-pressed={status === "done"}
                aria-label={`${DAY_LABELS[i]}: ${status ? DAILY_MARK_STATUS_LABELS[status] : "boş"}`}
                className={`flex min-h-11 w-full flex-col items-center justify-center rounded-lg text-[11px] font-medium transition-all duration-150 ${
                  !applicable
                    ? "cursor-default border border-dashed border-[var(--border-subtle)] text-[var(--muted)] opacity-50"
                    : statusClass
                } ${!editable && applicable ? "opacity-70" : ""} ${
                  editable && applicable ? "active:scale-90" : ""
                }`}
              >
                <span>{DAY_LABELS[i]}</span>
                <span aria-hidden className="text-sm leading-none">
                  {!applicable ? "–" : statusIcon}
                </span>
              </button>
              {applicable && editable && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDayNote(day);
                  }}
                  aria-label={`${DAY_LABELS[i]} kayıtları${entryCount > 0 ? ` (${entryCount} kayıt)` : " ekle"}`}
                  className={`absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border px-0.5 text-[9px] font-semibold leading-none shadow-sm transition-opacity ${
                    entryCount > 0
                      ? `${theme.fill} border-[var(--surface)] text-white opacity-100`
                      : "border-[var(--border-strong)] bg-[var(--surface)] text-[var(--muted)] opacity-70 hover:opacity-100"
                  }`}
                >
                  {entryCount > 0 ? entryCount : "+"}
                </button>
              )}
              {applicable && editable && pickerDay === day && (
                <>
                  <button
                    type="button"
                    aria-label="Kapat"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setPickerDay(null)}
                  />
                  <div
                    role="menu"
                    className="absolute left-1/2 top-full z-50 mt-1 flex -translate-x-1/2 gap-0.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--overlay)] p-1 shadow-xl backdrop-blur-xl backdrop-saturate-150"
                  >
                    {STATUS_PICKS.map((pick) => (
                      <button
                        key={pick.status ?? "none"}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onSetDayStatus(day, pick.status);
                          setPickerDay(null);
                        }}
                        aria-label={pick.status ? DAILY_MARK_STATUS_LABELS[pick.status] : "Boş"}
                        title={pick.status ? DAILY_MARK_STATUS_LABELS[pick.status] : "Boş"}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                          status === pick.status
                            ? "bg-[var(--foreground)] text-[var(--invert)]"
                            : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        {pick.icon}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {weekNode.notes && (
        <div className="mt-1.5">
          <button
            type="button"
            onClick={() => setReadMeOpen((v) => !v)}
            className="flex items-center gap-1 text-[11px] font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <span aria-hidden>📖</span>
            Read me
            <span aria-hidden className={`transition-transform ${readMeOpen ? "rotate-180" : ""}`}>
              ⌄
            </span>
          </button>
          {readMeOpen && (
            <p
              className={`mt-1.5 whitespace-pre-wrap rounded-lg border p-2.5 text-xs leading-relaxed text-[var(--foreground)] ${theme.softBg} ${theme.softBorder}`}
            >
              {weekNode.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
