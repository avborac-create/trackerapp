"use client";

import { useEffect, useState } from "react";
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
  onSave: (patch: { title: string; category: Category; externalStatus: ExternalStatus }) => void;
}) {
  const [title, setTitle] = useState(node.title);
  const [category, setCategory] = useState<Category>(node.category);
  const [status, setStatus] = useState<ExternalStatus>(node.externalStatus);

  useEffect(() => {
    setTitle(node.title);
    setCategory(node.category);
    setStatus(node.externalStatus);
  }, [node]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 md:items-center md:p-4">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 dark:bg-neutral-900 md:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            Düğümü düzenle
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        <label className="mt-4 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
          Ad
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
        </label>

        <div className="mt-4">
          <span className="block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            İç kategori
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {CATEGORY_ORDER.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  category === cat
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "border border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <span className="block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Dış durum
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  status === s
                    ? "bg-emerald-600 text-white"
                    : "border border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-neutral-400">
            Silme yerine düğümü &quot;Kapatıldı&quot; yapman önerilir.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-neutral-500"
          >
            Vazgeç
          </button>
          <button
            type="button"
            disabled={busy || !title.trim()}
            onClick={() => onSave({ title: title.trim(), category, externalStatus: status })}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
