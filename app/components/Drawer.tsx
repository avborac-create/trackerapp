"use client";

import { useState } from "react";
import { CATEGORY_LABELS, CATEGORY_ORDER, STATUS_LABELS, type Category, type NodeDTO } from "@/app/lib/types";

export function Drawer({
  nodes,
  editable,
  busy,
  onAddNode,
  onMoveToAgenda,
  onSetStatus,
  onEditNode,
}: {
  nodes: NodeDTO[];
  editable: boolean;
  busy: boolean;
  onAddNode: (title: string) => void;
  onMoveToAgenda: (nodeId: string, category: Category) => void;
  onSetStatus: (nodeId: string, status: "not_now" | "closed") => void;
  onEditNode: (nodeId: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [pickingCategoryFor, setPickingCategoryFor] = useState<string | null>(null);

  const groups: { status: "inbox" | "not_now" | "closed"; items: NodeDTO[] }[] = [
    { status: "inbox", items: nodes.filter((n) => n.externalStatus === "inbox") },
    { status: "not_now", items: nodes.filter((n) => n.externalStatus === "not_now") },
    { status: "closed", items: nodes.filter((n) => n.externalStatus === "closed") },
  ];

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
        Gelen Kutusu &amp; kapalı düğümler
      </h2>

      {editable && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            onAddNode(title.trim());
            setTitle("");
          }}
          className="mt-3 flex gap-2"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Yeni düğüm adı…"
            className="min-w-0 flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
          <button
            type="submit"
            disabled={busy || !title.trim()}
            className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            Ekle
          </button>
        </form>
      )}

      <div className="mt-4 space-y-4">
        {groups.map((g) => (
          <div key={g.status}>
            <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              {STATUS_LABELS[g.status]} ({g.items.length})
            </h3>
            {g.items.length === 0 ? (
              <p className="mt-1 text-xs text-neutral-300 dark:text-neutral-600">—</p>
            ) : (
              <ul className="mt-1.5 space-y-1.5">
                {g.items.map((n) => (
                  <li
                    key={n.id}
                    className="rounded-lg border border-neutral-100 p-2 text-sm dark:border-neutral-800"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onEditNode(n.id)}
                        className="truncate text-left hover:underline"
                      >
                        {n.title}
                      </button>
                      {editable && (
                        <div className="flex shrink-0 gap-1.5 text-xs">
                          {g.status !== "closed" && (
                            <button
                              type="button"
                              onClick={() =>
                                setPickingCategoryFor(pickingCategoryFor === n.id ? null : n.id)
                              }
                              disabled={busy}
                              className="rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300"
                            >
                              Gündeme al
                            </button>
                          )}
                          {g.status === "inbox" && (
                            <button
                              type="button"
                              onClick={() => onSetStatus(n.id, "not_now")}
                              disabled={busy}
                              className="rounded-full px-2 py-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            >
                              Şimdi değil
                            </button>
                          )}
                          {g.status !== "closed" && (
                            <button
                              type="button"
                              onClick={() => onSetStatus(n.id, "closed")}
                              disabled={busy}
                              className="rounded-full px-2 py-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            >
                              Kapat
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {pickingCategoryFor === n.id && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {CATEGORY_ORDER.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              onMoveToAgenda(n.id, cat);
                              setPickingCategoryFor(null);
                            }}
                            className="rounded-full border border-neutral-200 px-2 py-1 text-xs text-neutral-600 hover:border-emerald-400 hover:text-emerald-700 dark:border-neutral-700 dark:text-neutral-300"
                          >
                            {CATEGORY_LABELS[cat]}
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
