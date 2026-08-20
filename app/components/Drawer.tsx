"use client";

import { useEffect, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CATEGORY_LABELS, CATEGORY_ORDER, type Category, type NodeDTO } from "@/app/lib/types";
import { CATEGORY_THEME } from "@/app/lib/colors";

type DrawerStatus = "inbox" | "not_now" | "closed";

// Bölümün "anlam rengi": Gelen Kutusu = hakim renk (aksiyon bekliyor),
// Durduruldu = nötr/soluk, Kapatıldı = yeşil (tamamlanmış/arşiv).
const STATUS_ACCENT: Record<DrawerStatus, string> = {
  inbox: "var(--compass)",
  not_now: "var(--muted)",
  closed: "#10b981",
};

const STATUS_LABEL_PLAIN: Record<DrawerStatus, string> = {
  inbox: "Gelen Kutusu",
  not_now: "Durduruldu",
  closed: "Kapatıldı",
};

function DrawerCard({
  node,
  status,
  editable,
  busy,
  pickingCategory,
  onTogglePickCategory,
  onMoveToAgenda,
  onSetStatus,
  onEditNode,
}: {
  node: NodeDTO;
  status: "inbox" | "not_now" | "closed";
  editable: boolean;
  busy: boolean;
  pickingCategory: boolean;
  onTogglePickCategory: () => void;
  onMoveToAgenda: (category: Category) => void;
  onSetStatus: (status: "closed") => void;
  onEditNode: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `drawer-item-${node.id}`,
    data: { kind: "drawer", nodeId: node.id, status },
    disabled: !editable,
  });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        borderLeftColor: STATUS_ACCENT[status],
        borderLeftWidth: "3px",
      }}
      className={`rounded-lg border border-[var(--border-subtle)] p-3 text-sm ${
        isDragging ? "z-50 opacity-50 shadow-lg" : ""
      }`}
    >
      <div className="flex w-full items-center gap-1.5">
        {editable && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="shrink-0 cursor-grab touch-none px-0.5 text-[var(--muted)] opacity-60 active:cursor-grabbing"
            aria-label="Sürükle"
            title="Sürükleyerek taşı"
          >
            ⠿
          </button>
        )}
        <button
          type="button"
          onClick={onEditNode}
          className="flex min-w-0 flex-1 items-center gap-2 text-left font-medium text-[var(--foreground)] hover:underline"
        >
          <span className="truncate">{node.title}</span>
          {node.tags.map((tag) => (
            <span
              key={tag}
              className="shrink-0 rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-normal text-[var(--muted)] no-underline"
            >
              {tag}
            </span>
          ))}
        </button>
      </div>
      {editable && (
        <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs">
          {status !== "closed" && (
            <button
              type="button"
              onClick={onTogglePickCategory}
              disabled={busy}
              className="rounded-full bg-[var(--compass-soft)] px-2.5 py-1.5 font-medium text-[var(--compass)] hover:opacity-80"
            >
              Gündeme al
            </button>
          )}
          {status !== "closed" && (
            <button
              type="button"
              onClick={() => onSetStatus("closed")}
              disabled={busy}
              className="rounded-full px-2.5 py-1.5 text-[var(--muted)] hover:bg-[var(--surface-2)]"
            >
              Kapat
            </button>
          )}
        </div>
      )}

      {pickingCategory && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CATEGORY_ORDER.map((cat) => {
            const theme = CATEGORY_THEME[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onMoveToAgenda(cat)}
                className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] px-2 py-1 text-xs text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)]"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} aria-hidden />
                {CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>
      )}
    </li>
  );
}

function DrawerColumn({
  status,
  items,
  editable,
  busy,
  collapsed,
  onToggleCollapsed,
  pickingCategoryFor,
  onTogglePickCategory,
  onMoveToAgenda,
  onSetStatus,
  onEditNode,
}: {
  status: "inbox" | "not_now" | "closed";
  items: NodeDTO[];
  editable: boolean;
  busy: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  pickingCategoryFor: string | null;
  onTogglePickCategory: (nodeId: string) => void;
  onMoveToAgenda: (nodeId: string, category: Category) => void;
  onSetStatus: (nodeId: string, status: "closed") => void;
  onEditNode: (nodeId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `drawer-${status}`, disabled: !editable });

  return (
    <div ref={setNodeRef} className={`rounded-xl transition-colors ${isOver ? "ring-2 ring-[var(--border-strong)]" : ""}`}>
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="flex w-full items-center gap-1.5 px-1 py-0.5 text-xs font-bold uppercase tracking-wide"
        aria-expanded={!collapsed}
        aria-label={`${STATUS_LABEL_PLAIN[status]} bölümünü ${collapsed ? "aç" : "kapat"}`}
      >
        <span aria-hidden className={`text-[9px] text-[var(--muted)] transition-transform ${collapsed ? "-rotate-90" : ""}`}>
          ▾
        </span>
        <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_ACCENT[status] }} />
        <span style={{ color: STATUS_ACCENT[status] }}>{STATUS_LABEL_PLAIN[status]}</span>
        <span className="font-medium normal-case text-[var(--muted)]">({items.length})</span>
      </button>
      {!collapsed &&
        (items.length === 0 ? (
          <p className="mt-1.5 px-1 text-xs text-[var(--muted)] opacity-60">
            {isOver ? "Buraya bırak" : "—"}
          </p>
        ) : (
          <ul className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((n) => (
              <DrawerCard
                key={n.id}
                node={n}
                status={status}
                editable={editable}
                busy={busy}
                pickingCategory={pickingCategoryFor === n.id}
                onTogglePickCategory={() => onTogglePickCategory(n.id)}
                onMoveToAgenda={(cat) => onMoveToAgenda(n.id, cat)}
                onSetStatus={(s) => onSetStatus(n.id, s)}
                onEditNode={() => onEditNode(n.id)}
              />
            ))}
          </ul>
        ))}
    </div>
  );
}

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
  const [collapsedMap, setCollapsedMap] = useState<Record<DrawerStatus, boolean>>({
    inbox: false,
    not_now: false,
    closed: false,
  });

  useEffect(() => {
    const stored: Partial<Record<DrawerStatus, boolean>> = {};
    (["inbox", "not_now", "closed"] as DrawerStatus[]).forEach((status) => {
      const raw = window.localStorage.getItem(`tracker_drawer_collapsed_${status}`);
      if (raw !== null) stored[status] = raw === "1";
    });
    setCollapsedMap((prev) => ({ ...prev, ...stored }));
  }, []);

  function toggleColumnCollapsed(status: DrawerStatus) {
    setCollapsedMap((prev) => {
      const next = { ...prev, [status]: !prev[status] };
      window.localStorage.setItem(`tracker_drawer_collapsed_${status}`, next[status] ? "1" : "0");
      return next;
    });
  }

  const groups: { status: "inbox" | "not_now" | "closed"; items: NodeDTO[] }[] = [
    { status: "inbox", items: nodes.filter((n) => n.externalStatus === "inbox") },
    { status: "not_now", items: nodes.filter((n) => n.externalStatus === "not_now") },
    { status: "closed", items: nodes.filter((n) => n.externalStatus === "closed") },
  ];

  const { setNodeRef: setPanelRef, isOver: isPanelOver } = useDroppable({
    id: "drawer-panel",
    disabled: !editable,
  });

  return (
    <section
      ref={setPanelRef}
      className={`rounded-2xl border p-6 backdrop-blur-xl backdrop-saturate-150 transition-colors ${
        isPanelOver ? "border-[var(--border-strong)] bg-[var(--surface-2)]" : "border-[var(--border-subtle)] bg-[var(--surface)]"
      }`}
    >
      <h2 className="font-display text-base text-[var(--foreground)]">
        Eylem Yönetim Paneli
        {isPanelOver && (
          <span className="ml-2 align-middle text-xs font-normal text-[var(--compass)]">
            Buraya bırak → Gelen Kutusu
          </span>
        )}
      </h2>

      {editable && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            onAddNode(title.trim());
            setTitle("");
          }}
          className="mt-4 flex gap-2"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Yeni eylem adı…"
            className="min-w-0 flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)]"
          />
          <button
            type="submit"
            disabled={busy || !title.trim()}
            className="rounded-lg bg-[var(--foreground)] px-4 py-2.5 text-sm font-medium text-[var(--invert)] disabled:opacity-50"
          >
            Ekle
          </button>
        </form>
      )}

      <div className="mt-6 space-y-6">
        {groups.map((g) => (
          <DrawerColumn
            key={g.status}
            status={g.status}
            items={g.items}
            editable={editable}
            busy={busy}
            collapsed={collapsedMap[g.status]}
            onToggleCollapsed={() => toggleColumnCollapsed(g.status)}
            pickingCategoryFor={pickingCategoryFor}
            onTogglePickCategory={(nodeId) =>
              setPickingCategoryFor(pickingCategoryFor === nodeId ? null : nodeId)
            }
            onMoveToAgenda={(nodeId, cat) => {
              onMoveToAgenda(nodeId, cat);
              setPickingCategoryFor(null);
            }}
            onSetStatus={onSetStatus}
            onEditNode={onEditNode}
          />
        ))}
      </div>
    </section>
  );
}
