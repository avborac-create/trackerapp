"use client";

import { DAY_LABELS, fromISODate } from "@/app/lib/dates";

export function MiniCalendar({
  weekDays,
  todayISO,
  selectedDay = null,
  onSelectDay,
}: {
  weekDays: string[];
  todayISO: string;
  selectedDay?: string | null;
  onSelectDay?: (day: string) => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-7 gap-1.5" role="group" aria-label="Bu haftanın günleri">
      {weekDays.map((day, i) => {
        const isToday = day === todayISO;
        const isSelected = day === selectedDay;
        const dateNum = fromISODate(day).getDate();
        return (
          <button
            key={day}
            type="button"
            onClick={() => onSelectDay?.(isSelected ? "" : day)}
            aria-pressed={isSelected}
            aria-label={`${DAY_LABELS[i]} ${dateNum}${isToday ? " (bugün)" : ""}`}
            className={`flex flex-col items-center justify-center rounded-lg border py-1.5 text-center transition-colors ${
              isToday
                ? "border-[var(--route)] bg-[var(--route)] text-white"
                : isSelected
                  ? "border-[var(--compass)] bg-[var(--compass-soft)] text-[var(--compass)]"
                  : "border-[var(--border-subtle)] text-[var(--muted)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <span className="text-[10px] font-medium uppercase tracking-wide">{DAY_LABELS[i]}</span>
            <span
              className={`text-sm font-semibold tabular-nums ${isToday || isSelected ? "" : "text-[var(--foreground)]"}`}
            >
              {dateNum}
            </span>
          </button>
        );
      })}
    </div>
  );
}
