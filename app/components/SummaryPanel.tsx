"use client";

import { CATEGORY_THEME } from "@/app/lib/colors";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/app/lib/types";
import type { WeekStats } from "@/app/lib/stats";

export function SummaryPanel({ stats }: { stats: WeekStats }) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 backdrop-blur-xl backdrop-saturate-150">
      <h2 className="font-display text-base text-[var(--foreground)]">Bu hafta</h2>

      <div className="mt-3 flex items-end gap-2">
        <span className="font-display bg-gradient-to-br from-violet-500 via-rose-500 to-emerald-500 bg-clip-text text-3xl font-bold tabular-nums text-transparent">
          {stats.percent}%
        </span>
        <span className="pb-1 text-xs text-[var(--muted)]">
          {stats.totalCompleted}/{stats.totalPossible} işaret
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        {CATEGORY_ORDER.map((cat) => {
          const c = stats.byCategory[cat];
          const theme = CATEGORY_THEME[cat];
          return (
            <div key={cat}>
              <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                <span className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} aria-hidden />
                  {CATEGORY_LABELS[cat]}
                </span>
                <span className="tabular-nums">
                  {c.completed}/{c.possible}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                <div
                  className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-300 ${theme.barFrom} ${theme.barTo}`}
                  style={{ width: `${c.percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {stats.topNode && (
        <p className="mt-4 text-xs text-[var(--muted)]">
          En çok işaretlenen:{" "}
          <span className="font-medium text-[var(--foreground)]">{stats.topNode.title}</span>{" "}
          ({stats.topNode.completed})
        </p>
      )}

      <div className="mt-4">
        <div className="flex justify-between text-xs text-[var(--muted)]">
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
                  className="w-3 rounded-t bg-gradient-to-t from-violet-500 to-rose-400"
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
