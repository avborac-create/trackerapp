"use client";

import { DAY_LABELS, fromISODate } from "@/app/lib/dates";

export function MiniCalendar({
  weekDays,
  todayISO,
}: {
  weekDays: string[];
  todayISO: string;
}) {
  return (
    <div className="mt-3 grid grid-cols-7 gap-1.5" role="group" aria-label="Bu haftanın günleri">
      {weekDays.map((day, i) => {
        const isToday = day === todayISO;
        const dateNum = fromISODate(day).getDate();
        return (
          <div
            key={day}
            className={`flex flex-col items-center justify-center rounded-lg border py-1.5 text-center transition-colors ${
              isToday
                ? "border-[var(--route)] bg-[var(--route)] text-white"
                : "border-[var(--border-subtle)] text-[var(--muted)]"
            }`}
          >
            <span className="text-[10px] font-medium uppercase tracking-wide">{DAY_LABELS[i]}</span>
            <span className={`text-sm font-semibold tabular-nums ${isToday ? "" : "text-[var(--foreground)]"}`}>
              {dateNum}
            </span>
          </div>
        );
      })}
    </div>
  );
}
