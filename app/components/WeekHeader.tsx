"use client";

import Link from "next/link";
import { formatWeekRange } from "@/app/lib/dates";

export function WeekHeader({
  weekStartISO,
  weekEndISO,
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
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev || busy}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 disabled:opacity-30 dark:border-neutral-700 dark:text-neutral-300"
          aria-label="Önceki hafta"
        >
          ‹
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            {formatWeekRange(weekStartISO, weekEndISO)}
          </div>
          <div className="text-xs text-neutral-400">
            {!isOpen
              ? "Geçmiş (salt okunur)"
              : isCurrentWeek
                ? "Bu hafta"
                : "Açık hafta"}
          </div>
        </div>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext || busy}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 disabled:opacity-30 dark:border-neutral-700 dark:text-neutral-300"
          aria-label="Sonraki hafta"
        >
          ›
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Dashboard
        </Link>
        <Link
          href="/history"
          className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Hafta geçmişi
        </Link>
        {isOpen && (
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            Haftayı Kapat
          </button>
        )}
      </div>
    </header>
  );
}
