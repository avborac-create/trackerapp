"use client";

import { DAY_LABELS } from "@/app/lib/dates";
import type { WeekNodeDTO } from "@/app/lib/types";
import type { NodeStat } from "@/app/lib/stats";

export function NodeCard({
  weekNode,
  weekDays,
  stat,
  editable,
  onToggleDay,
  onEdit,
}: {
  weekNode: WeekNodeDTO;
  weekDays: string[];
  stat: NodeStat;
  editable: boolean;
  onToggleDay: (day: string) => void;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="text-left text-sm font-medium text-neutral-800 hover:underline dark:text-neutral-100"
        >
          {weekNode.title}
        </button>
        <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs tabular-nums text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
          {stat.completed}/{stat.possible}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {weekDays.map((day, i) => {
          const applicable = day >= weekNode.includedOn && (!weekNode.removedOn || day <= weekNode.removedOn);
          const completed = !!weekNode.marks[day];
          return (
            <button
              key={day}
              type="button"
              disabled={!editable || !applicable}
              onClick={() => onToggleDay(day)}
              aria-pressed={completed}
              aria-label={`${DAY_LABELS[i]}: ${completed ? "tamamlandı" : "boş"}`}
              className={`flex min-h-11 flex-col items-center justify-center rounded-lg text-[11px] font-medium transition-colors ${
                !applicable
                  ? "cursor-default border border-dashed border-neutral-200 text-neutral-300 dark:border-neutral-800 dark:text-neutral-700"
                  : completed
                    ? "bg-emerald-600 text-white"
                    : "border border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
              } ${!editable && applicable ? "opacity-70" : ""}`}
            >
              <span>{DAY_LABELS[i]}</span>
              <span aria-hidden className="text-sm leading-none">
                {!applicable ? "–" : completed ? "✓" : "○"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
