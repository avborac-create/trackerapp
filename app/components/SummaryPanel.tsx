"use client";

import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/app/lib/types";
import type { WeekStats } from "@/app/lib/stats";

export function SummaryPanel({ stats }: { stats: WeekStats }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">Bu hafta</h2>

      <div className="mt-3 flex items-end gap-2">
        <span className="text-3xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
          {stats.percent}%
        </span>
        <span className="pb-1 text-xs text-neutral-400">
          {stats.totalCompleted}/{stats.totalPossible} işaret
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {CATEGORY_ORDER.map((cat) => {
          const c = stats.byCategory[cat];
          return (
            <div key={cat}>
              <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>{CATEGORY_LABELS[cat]}</span>
                <span className="tabular-nums">
                  {c.completed}/{c.possible}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div
                  className="h-full rounded-full bg-emerald-600"
                  style={{ width: `${c.percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {stats.topNode && (
        <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
          En çok işaretlenen: <span className="font-medium text-neutral-700 dark:text-neutral-200">{stats.topNode.title}</span> ({stats.topNode.completed})
        </p>
      )}

      <div className="mt-4">
        <div className="flex justify-between text-xs text-neutral-400">
          {stats.byDay.map((d) => (
            <span key={d.day} className="w-6 text-center">
              {d.label}
            </span>
          ))}
        </div>
        <div className="mt-1 flex justify-between gap-1">
          {stats.byDay.map((d) => {
            const max = Math.max(1, ...stats.byDay.map((x) => x.count));
            const h = Math.max(4, Math.round((d.count / max) * 28));
            return (
              <div key={d.day} className="flex w-6 flex-col items-center justify-end">
                <div
                  className="w-3 rounded-t bg-emerald-500/70"
                  style={{ height: `${h}px` }}
                  title={`${d.label}: ${d.count}`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
