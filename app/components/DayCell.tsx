"use client";

import { useState } from "react";
import { DAILY_MARK_STATUS_LABELS, type DailyMarkStatus } from "@/app/lib/types";
import type { DayBadgeStyle } from "@/app/lib/prefs";

const STATUS_PICKS: { status: DailyMarkStatus | null; icon: string }[] = [
  { status: "done", icon: "✓" },
  { status: "unexpected", icon: "⚠" },
  { status: "neglected", icon: "✕" },
  { status: null, icon: "○" },
];

export function DayCell({
  size = "sm",
  applicable,
  editable,
  status,
  entryCount,
  badgeStyle,
  fillClass,
  dayLabel,
  onToggleDone,
  onSetStatus,
  onOpenNote,
}: {
  size?: "sm" | "lg";
  applicable: boolean;
  editable: boolean;
  status: DailyMarkStatus | null;
  entryCount: number;
  badgeStyle: DayBadgeStyle;
  fillClass: string;
  dayLabel: string;
  onToggleDone: () => void;
  onSetStatus: (status: DailyMarkStatus | null) => void;
  onOpenNote: () => void;
}) {
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number } | null>(null);

  const statusIcon = status === "done" ? "✓" : status === "unexpected" ? "⚠" : status === "neglected" ? "✕" : "○";
  const statusClass =
    status === "done"
      ? `${fillClass} text-white`
      : status === "unexpected"
        ? "bg-amber-500 text-white"
        : status === "neglected"
          ? "bg-rose-500 text-white"
          : "border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--muted)]";

  function openPicker(target: HTMLElement) {
    const rect = target.getBoundingClientRect();
    const menuHeight = 44;
    const opensUp = rect.bottom + 6 + menuHeight > window.innerHeight;
    setPickerPos({
      top: opensUp ? rect.top - 6 - menuHeight : rect.bottom + 6,
      left: Math.min(Math.max(rect.left + rect.width / 2, 80), window.innerWidth - 80),
    });
  }

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (!applicable || !editable) return;
    if (status === null) {
      onToggleDone();
    } else {
      openPicker(e.currentTarget);
    }
  }

  const dim = size === "lg" ? "aspect-square w-full min-h-11" : "h-full w-full min-h-9";
  const textSize = size === "lg" ? "text-base" : "text-[11px]";

  return (
    <div className="relative">
      {size === "lg" && (
        <div className="mb-1 text-center text-[9px] font-semibold uppercase tracking-wide text-[var(--muted)]">
          {dayLabel}
        </div>
      )}
      <button
        type="button"
        disabled={!editable || !applicable}
        onClick={handleClick}
        aria-pressed={status === "done"}
        aria-label={`${dayLabel}: ${status ? DAILY_MARK_STATUS_LABELS[status] : "boş"}`}
        className={`relative flex ${dim} items-center justify-center rounded-lg font-medium transition-all duration-150 ${textSize} ${
          !applicable
            ? "cursor-default border border-dashed border-[var(--border-subtle)] text-[var(--muted)] opacity-50"
            : statusClass
        } ${editable && applicable ? "active:scale-90" : ""}`}
      >
        {badgeStyle === "number" && entryCount > 0 ? (
          <>
            <span className={size === "lg" ? "text-lg font-bold" : "text-xs font-bold"}>{entryCount}</span>
            {status === "done" && (
              <span
                aria-hidden
                className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[var(--surface)] bg-[var(--foreground)] text-[7px] text-[var(--invert)]"
              >
                ✓
              </span>
            )}
          </>
        ) : (
          <>
            <span aria-hidden>{!applicable ? "–" : statusIcon}</span>
            {badgeStyle === "corner" && entryCount > 0 && (
              <span aria-hidden className="absolute right-0.5 top-0.5 text-[8px] font-bold leading-none opacity-90">
                {entryCount}
              </span>
            )}
          </>
        )}
      </button>

      {applicable && editable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenNote();
          }}
          aria-label={`${dayLabel} kayıtları${entryCount > 0 ? ` (${entryCount} kayıt)` : " ekle"}`}
          className={`absolute bottom-0.5 right-0.5 flex h-[13px] min-w-[13px] items-center justify-center rounded-full text-[8px] font-semibold leading-none opacity-0 hover:opacity-100 ${
            entryCount > 0 ? "opacity-70" : ""
          }`}
        >
          {entryCount > 0 ? "" : "+"}
        </button>
      )}

      {pickerPos && (
        <>
          <button
            type="button"
            aria-label="Kapat"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setPickerPos(null)}
          />
          <div
            role="menu"
            style={{ top: pickerPos.top, left: pickerPos.left }}
            className="fixed z-50 flex -translate-x-1/2 gap-0.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--overlay)] p-1 shadow-xl backdrop-blur-xl backdrop-saturate-150"
          >
            {STATUS_PICKS.map((pick) => (
              <button
                key={pick.status ?? "none"}
                type="button"
                role="menuitem"
                onClick={() => {
                  onSetStatus(pick.status);
                  setPickerPos(null);
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
}
