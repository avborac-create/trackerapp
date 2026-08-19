"use client";

import { useState } from "react";
import type { DailyMarkEntryKind, DayEntry } from "@/app/lib/types";

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
  onAdd: (text: string, kind: DailyMarkEntryKind) => void;
  onDelete: (entryId: string) => void;
}) {
  const [text, setText] = useState("");
  const [kind, setKind] = useState<DailyMarkEntryKind>("success");

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
                <span
                  aria-hidden
                  title={entry.kind === "failure" ? "Başarısız" : "Başarılı"}
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                    entry.kind === "failure"
                      ? "bg-rose-500/15 text-rose-500"
                      : "bg-emerald-500/15 text-emerald-500"
                  }`}
                >
                  {entry.kind === "failure" ? "✕" : "✓"}
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
            onAdd(text.trim(), kind);
            setText("");
            setKind("success");
          }}
          className="mt-4"
        >
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setKind("success")}
              aria-pressed={kind === "success"}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                kind === "success"
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-500"
                  : "border-[var(--border-subtle)] text-[var(--muted)] hover:bg-[var(--surface-2)]"
              }`}
            >
              ✓ Başardım
            </button>
            <button
              type="button"
              onClick={() => setKind("failure")}
              aria-pressed={kind === "failure"}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                kind === "failure"
                  ? "border-rose-500/40 bg-rose-500/15 text-rose-500"
                  : "border-[var(--border-subtle)] text-[var(--muted)] hover:bg-[var(--surface-2)]"
              }`}
            >
              ✕ Başaramadım
            </button>
          </div>
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder={
              kind === "failure" ? "Bu sefer ne oldu / neden olmadı?" : "Bu sefer hangi konuda / nasıl uyguladın?"
            }
            className="mt-3 w-full resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--compass)] focus:outline-none focus:ring-2 focus:ring-[var(--compass)]/25"
          />
          <p className="mt-1.5 text-[11px] text-[var(--muted)] opacity-80">
            Her kayıt ayrı sayılır — aynı gün içinde istediğin kadar ekleyebilirsin.
            {kind === "success"
              ? " \"Başardım\" günü otomatik tamamlandı işaretler."
              : " \"Başaramadım\" günün işaretini değiştirmez, sadece kayıt tutar."}
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
