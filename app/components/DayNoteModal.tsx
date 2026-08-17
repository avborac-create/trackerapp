"use client";

import { useState } from "react";
import type { DayEntry } from "@/app/lib/types";

export function DayNoteModal({
  title,
  dayLabel,
  entries,
  busy,
  onClose,
  onAdd,
  onDelete,
}: {
  title: string;
  dayLabel: string;
  entries: DayEntry[];
  busy: boolean;
  onClose: () => void;
  onAdd: (text: string) => void;
  onDelete: (entryId: string) => void;
}) {
  const [text, setText] = useState("");

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex h-dvh items-end justify-center bg-black/40 p-0 backdrop-blur-sm md:items-center md:p-4">
      <div className="max-h-[85dvh] w-full max-w-sm overflow-y-auto rounded-t-2xl bg-[var(--surface)] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-xl backdrop-saturate-150 md:rounded-2xl md:pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base text-[var(--foreground)]">
              {dayLabel} kayıtları
            </h2>
            <p className="text-xs text-[var(--muted)]">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        {entries.length > 0 && (
          <ul className="mt-4 space-y-2">
            {entries.map((entry, i) => (
              <li
                key={entry.id}
                className="flex items-start gap-2 rounded-lg border border-[var(--border-subtle)] p-2.5 text-sm"
              >
                <span className="mt-0.5 shrink-0 text-xs font-semibold text-[var(--muted)]">
                  {i + 1}
                </span>
                <span className="flex-1 whitespace-pre-wrap text-[var(--foreground)]">
                  {entry.text || <span className="italic text-[var(--muted)]">Açıklama yok</span>}
                </span>
                <button
                  type="button"
                  onClick={() => onDelete(entry.id)}
                  disabled={busy}
                  className="shrink-0 text-[var(--muted)] hover:text-[var(--route)] disabled:opacity-50"
                  aria-label="Kaydı sil"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAdd(text.trim());
            setText("");
          }}
          className="mt-4"
        >
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Bu sefer hangi konuda / nasıl uyguladın?"
            className="w-full resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--compass)] focus:outline-none focus:ring-2 focus:ring-[var(--compass)]/25"
          />
          <p className="mt-1.5 text-[11px] text-[var(--muted)] opacity-80">
            Her kayıt ayrı sayılır — aynı gün içinde istediğin kadar ekleyebilirsin. Açıklama
            yazmadan da kaydedebilirsin.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-2)]"
            >
              Kapat
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--invert)] shadow-sm disabled:opacity-50"
            >
              Kayıt ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
