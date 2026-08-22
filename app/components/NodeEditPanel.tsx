"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { CATEGORY_THEME } from "@/app/lib/colors";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  STATUS_LABELS,
  type Category,
  type ExternalStatus,
  type NodeDTO,
} from "@/app/lib/types";

const STATUS_ORDER: ExternalStatus[] = ["inbox", "not_now", "on_agenda", "closed"];

export function NodeEditPanel({
  node,
  busy,
  onClose,
  onSave,
}: {
  node: NodeDTO;
  busy: boolean;
  onClose: () => void;
  onSave: (patch: {
    title: string;
    category: Category;
    externalStatus: ExternalStatus;
    notes: string | null;
    tags: string[];
  }) => void;
}) {
  const [title, setTitle] = useState(node.title);
  const [category, setCategory] = useState<Category>(node.category);
  const [status, setStatus] = useState<ExternalStatus>(node.externalStatus);
  const [notes, setNotes] = useState(node.notes ?? "");
  const [tags, setTags] = useState<string[]>(node.tags);
  const [tagDraft, setTagDraft] = useState("");
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Modal açıkken arka sayfayı kilitler; kapanınca kullanıcı tam bıraktığı
  // yere döner (bkz. DayNoteModal — aynı sınıftan bug, aynı çözüm).
  useEffect(() => {
    const scrollY = window.scrollY;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = prevOverflow;
      window.scrollTo(0, scrollY);
    };
  }, []);

  function commitTagDraft() {
    const trimmed = tagDraft.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagDraft("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function nextListNumber(value: string, lineStart: number): number {
    if (lineStart === 0) return 1;
    const prevLineStart = value.lastIndexOf("\n", lineStart - 2) + 1;
    const prevLine = value.slice(prevLineStart, lineStart - 1);
    const match = prevLine.match(/^(\s*)(\d+)\.\s/);
    return match ? parseInt(match[2], 10) + 1 : 1;
  }

  function insertListPrefix(kind: "bullet" | "number") {
    const textarea = notesRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? notes.length;
    const lineStart = notes.lastIndexOf("\n", start - 1) + 1;
    const prefix = kind === "bullet" ? "• " : `${nextListNumber(notes, lineStart)}. `;
    const newValue = notes.slice(0, lineStart) + prefix + notes.slice(lineStart);
    setNotes(newValue);
    const newPos = start + prefix.length;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newPos, newPos);
    });
  }

  // Madde/numara işaretiyle başlayan bir satırda Enter'a basınca listeyi
  // otomatik sürdürür; boş bir madde satırında Enter listeyi sonlandırır.
  function handleNotesKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter") return;
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    if (start !== textarea.selectionEnd) return;
    const lineStart = notes.lastIndexOf("\n", start - 1) + 1;
    const line = notes.slice(lineStart, start);
    const bulletMatch = line.match(/^(\s*)• /);
    const numberMatch = line.match(/^(\s*)(\d+)\. /);
    const match = bulletMatch ?? numberMatch;
    if (!match) return;
    e.preventDefault();
    const content = line.slice(match[0].length);
    if (content.trim() === "") {
      const newValue = notes.slice(0, lineStart) + notes.slice(start);
      setNotes(newValue);
      requestAnimationFrame(() => textarea.setSelectionRange(lineStart, lineStart));
      return;
    }
    const nextPrefix = bulletMatch
      ? `${bulletMatch[1]}• `
      : `${numberMatch![1]}${parseInt(numberMatch![2], 10) + 1}. `;
    const insert = `\n${nextPrefix}`;
    const newValue = notes.slice(0, start) + insert + notes.slice(start);
    setNotes(newValue);
    const newPos = start + insert.length;
    requestAnimationFrame(() => textarea.setSelectionRange(newPos, newPos));
  }

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex h-dvh items-end justify-center bg-black/40 p-0 backdrop-blur-sm md:items-center md:p-4">
      <div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-[var(--surface)] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-xl backdrop-saturate-150 md:rounded-2xl md:pb-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base text-[var(--foreground)]">
            Eylemi düzenle
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        <label className="mt-4 block text-xs font-medium text-[var(--muted)]">
          Ad
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--compass)] focus:outline-none focus:ring-2 focus:ring-[var(--compass)]/25"
          />
        </label>

        <div className="mt-4">
          <span className="block text-xs font-medium text-[var(--muted)]">
            İç kategori
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {CATEGORY_ORDER.map((cat) => {
              const theme = CATEGORY_THEME[cat];
              const selected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? `${theme.chipBg} ${theme.text} ring-1 ${theme.ring}`
                      : "border border-[var(--border-subtle)] text-[var(--muted)]"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} aria-hidden />
                  {CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>
        </div>

        {category === "multi" && (
          <div className="mt-4">
            <span className="block text-xs font-medium text-[var(--muted)]">
              Etiketler{" "}
              <span className="font-normal opacity-70">
                (nerede/ne zaman uygulandığını belirt — örn. hastane, haciz, araba)
              </span>
            </span>
            {tags.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-[var(--surface-2)] py-1 pl-2.5 pr-1.5 text-xs text-[var(--foreground)]"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      aria-label={`${tag} etiketini kaldır`}
                      className="flex h-4 w-4 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)]"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="mt-1.5 flex gap-1.5">
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    commitTagDraft();
                  }
                }}
                placeholder="Yeni etiket, Enter'a bas…"
                className="min-w-0 flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--compass)] focus:outline-none focus:ring-2 focus:ring-[var(--compass)]/25"
              />
              <button
                type="button"
                onClick={commitTagDraft}
                disabled={!tagDraft.trim()}
                className="rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface-2)] disabled:opacity-40"
              >
                Ekle
              </button>
            </div>
          </div>
        )}

        <div className="mt-4">
          <span className="block text-xs font-medium text-[var(--muted)]">
            Dış durum
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  status === s
                    ? "bg-[var(--foreground)] text-[var(--invert)]"
                    : "border border-[var(--border-subtle)] text-[var(--muted)]"
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-[var(--muted)] opacity-80">
            Silme yerine eylemi &quot;Kapatıldı&quot; yapman önerilir.
          </p>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-[var(--muted)]">
            Read me{" "}
            <span className="font-normal text-[var(--muted)] opacity-70">
              (her gün hatırlaman gereken şeyler)
            </span>
          </label>
          <div className="mt-1.5 flex gap-1.5">
            <button
              type="button"
              onClick={() => insertListPrefix("bullet")}
              className="rounded-lg border border-[var(--border-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
            >
              • Madde
            </button>
            <button
              type="button"
              onClick={() => insertListPrefix("number")}
              className="rounded-lg border border-[var(--border-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
            >
              1. Numara
            </button>
          </div>
          <textarea
            ref={notesRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={handleNotesKeyDown}
            rows={10}
            placeholder="Örn. neden yaptığını, nasıl yapman gerektiğini ya da kendine bir notu buraya yaz…"
            className="mt-1.5 w-full resize-y rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2.5 text-sm leading-relaxed text-[var(--foreground)] focus:border-[var(--compass)] focus:outline-none focus:ring-2 focus:ring-[var(--compass)]/25"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-[var(--surface-2)]"
          >
            Vazgeç
          </button>
          <button
            type="button"
            disabled={busy || !title.trim()}
            onClick={() => {
              const trimmedDraft = tagDraft.trim();
              const finalTags = trimmedDraft && !tags.includes(trimmedDraft) ? [...tags, trimmedDraft] : tags;
              onSave({
                title: title.trim(),
                category,
                externalStatus: status,
                notes: notes.trim() ? notes.trim() : null,
                tags: finalTags,
              });
            }}
            className="rounded-lg bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--invert)] shadow-sm disabled:opacity-50"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
