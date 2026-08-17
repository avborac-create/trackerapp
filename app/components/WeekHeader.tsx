"use client";

import { formatWeekRange } from "@/app/lib/dates";
import { MiniCalendar } from "@/app/components/MiniCalendar";

export function WeekHeader({
  weekStartISO,
  weekEndISO,
  weekDays,
  todayISO,
  isCurrentWeek,
  isOpen,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onClose,
  busy,
}: {
  weekStartISO: string;
  weekEndISO: string;
  weekDays: string[];
  todayISO: string;
  isCurrentWeek: boolean;
  isOpen: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  busy: boolean;
}) {
  return (
    <header>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev || busy}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-strong)] text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Önceki hafta"
          >
            ‹
          </button>
          <div className="text-center">
            <div className="font-display text-base text-[var(--foreground)]">
              {formatWeekRange(weekStartISO, weekEndISO)}
            </div>
            <div className="text-xs text-[var(--muted)]">
              {!isOpen ? "Geçmiş (salt okunur)" : isCurrentWeek ? "Bu hafta" : "Açık hafta"}
            </div>
          </div>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext || busy}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-strong)] text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Sonraki hafta"
          >
            ›
          </button>
        </div>

        {isOpen && (
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full bg-[var(--compass)] px-4 py-1.5 text-xs font-medium text-[var(--compass-soft)] shadow-sm transition-opacity disabled:opacity-50"
          >
            Haftayı Kapat
          </button>
        )}
      </div>

      <MiniCalendar weekDays={weekDays} todayISO={todayISO} />
    </header>
  );
}
