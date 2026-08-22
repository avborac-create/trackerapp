"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  addNode,
  getAllNodesAction,
  moveNodeToAgenda,
  setNodeExternalStatus,
  updateNode,
} from "@/app/lib/actions";
import { getWeekStart, toISODate } from "@/app/lib/dates";
import { CATEGORY_THEME } from "@/app/lib/colors";
import {
  KANBAN_STATUS_LABELS,
  KANBAN_STATUS_ORDER,
  type Category,
  type ExternalStatus,
  type NodeDTO,
} from "@/app/lib/types";
import { NodeEditPanel } from "@/app/components/NodeEditPanel";

const COLUMN_HINTS: Record<ExternalStatus, string> = {
  inbox: "Henüz karar verilmedi",
  on_agenda: "Bu hafta aktif takipte",
  not_now: "Açık ama duraklatıldı",
  closed: "Döngüden çıkarıldı",
};

const COLUMN_ACCENT: Record<ExternalStatus, string> = {
  inbox: "border-t-[var(--muted)]",
  on_agenda: "border-t-rose-500",
  not_now: "border-t-amber-400",
  closed: "border-t-emerald-500",
};

function BoardCard({
  node,
  busy,
  onMove,
  onEdit,
}: {
  node: NodeDTO;
  busy: boolean;
  onMove: (status: ExternalStatus) => void;
  onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `board-card-${node.id}`,
    data: { nodeId: node.id, status: node.externalStatus, title: node.title },
  });
  const theme = CATEGORY_THEME[node.category];
  const otherStatuses = KANBAN_STATUS_ORDER.filter((s) => s !== node.externalStatus);

  return (
    <li
      ref={setNodeRef}
      className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3 text-sm shadow-sm ${
        isDragging ? "z-50 opacity-50 shadow-lg" : ""
      }`}
    >
      <div className="flex items-start gap-1.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-0.5 shrink-0 cursor-grab touch-none px-0.5 text-[var(--muted)] opacity-60 active:cursor-grabbing"
          aria-label="Sürükle"
          title="Sürükleyerek taşı"
        >
          ⠿
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-left font-medium text-[var(--foreground)] hover:underline"
        >
          {node.externalStatus === "on_agenda" && (
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${theme.dot}`} aria-hidden />
          )}
          <span className="truncate">{node.title}</span>
        </button>
      </div>

      {node.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1 pl-5">
          {node.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-normal text-[var(--muted)]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-1 pl-5">
        {otherStatuses.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy}
            onClick={() => onMove(s)}
            className="rounded-full bg-[var(--surface-2)] px-2 py-1 text-[10px] font-medium text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-40"
          >
            → {KANBAN_STATUS_LABELS[s]}
          </button>
        ))}
      </div>
    </li>
  );
}

function BoardColumn({
  status,
  nodes,
  busy,
  onMove,
  onEdit,
}: {
  status: ExternalStatus;
  nodes: NodeDTO[];
  busy: boolean;
  onMove: (nodeId: string, status: ExternalStatus) => void;
  onEdit: (nodeId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `board-col-${status}` });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[80%] shrink-0 snap-start flex-col rounded-2xl border border-t-4 bg-[var(--surface-2)]/40 p-3 transition-colors sm:min-w-0 sm:shrink ${
        COLUMN_ACCENT[status]
      } ${isOver ? "ring-2 ring-[var(--border-strong)]" : ""}`}
    >
      <h2 className="flex items-baseline justify-between px-1">
        <span className="font-display text-sm font-bold tracking-wide text-[var(--foreground)]">
          {KANBAN_STATUS_LABELS[status]}
        </span>
        <span className="text-xs tabular-nums text-[var(--muted)]">{nodes.length}</span>
      </h2>
      <p className="px-1 text-[11px] text-[var(--muted)] opacity-70">{COLUMN_HINTS[status]}</p>

      <ul className="mt-3 min-h-[3rem] flex-1 space-y-2">
        {nodes.length === 0 ? (
          <li className="px-1 text-xs text-[var(--muted)] opacity-60">
            {isOver ? "Buraya bırak" : "—"}
          </li>
        ) : (
          nodes.map((n) => (
            <BoardCard key={n.id} node={n} busy={busy} onMove={(s) => onMove(n.id, s)} onEdit={() => onEdit(n.id)} />
          ))
        )}
      </ul>
    </div>
  );
}

export function StatusBoard({ initialNodes }: { initialNodes: NodeDTO[] }) {
  const [nodes, setNodes] = useState<NodeDTO[]>(initialNodes);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [activeDragTitle, setActiveDragTitle] = useState<string | null>(null);
  const [dates, setDates] = useState<{ todayISO: string; weekStartISO: string; weekEndISO: string } | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    const now = new Date();
    const start = getWeekStart(now);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    setDates({ todayISO: toISODate(now), weekStartISO: toISODate(start), weekEndISO: toISODate(end) });
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  const columns = useMemo(() => {
    const map: Record<ExternalStatus, NodeDTO[]> = { inbox: [], on_agenda: [], not_now: [], closed: [] };
    for (const n of nodes) map[n.externalStatus].push(n);
    return map;
  }, [nodes]);

  async function refreshNodes() {
    setNodes(await getAllNodesAction());
  }

  async function handleAddNode() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const created = await addNode(trimmed);
      setNodes((prev) => [created, ...prev]);
      setTitle("");
    } finally {
      setBusy(false);
    }
  }

  async function handleMoveToStatus(nodeId: string, targetStatus: ExternalStatus) {
    if (!dates) return;
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || node.externalStatus === targetStatus) return;
    const prevNodes = nodes;
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, externalStatus: targetStatus } : n)));
    setBusy(true);
    try {
      if (targetStatus === "on_agenda") {
        await moveNodeToAgenda(nodeId, node.category, dates.todayISO, dates.weekStartISO, dates.weekEndISO);
      } else {
        await setNodeExternalStatus(nodeId, targetStatus, dates.todayISO);
      }
    } catch {
      setNodes(prevNodes);
      setNotice("Durum güncellenemedi, tekrar dene.");
    } finally {
      setBusy(false);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as { title?: string } | undefined;
    setActiveDragTitle(data?.title ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragTitle(null);
    const { active, over } = event;
    if (!over) return;
    const data = active.data.current as { nodeId: string; status: ExternalStatus } | undefined;
    if (!data) return;
    const overId = String(over.id);
    if (!overId.startsWith("board-col-")) return;
    const targetStatus = overId.slice("board-col-".length) as ExternalStatus;
    if (targetStatus === data.status) return;
    handleMoveToStatus(data.nodeId, targetStatus);
  }

  const editingNode = nodes.find((n) => n.id === editingNodeId) ?? null;

  async function handleSaveEdit(patch: {
    title: string;
    category: Category;
    externalStatus: ExternalStatus;
    notes: string | null;
    tags: string[];
  }) {
    if (!editingNode || !dates) return;
    setBusy(true);
    try {
      const wasOnAgenda = editingNode.externalStatus === "on_agenda";
      const willBeOnAgenda = patch.externalStatus === "on_agenda";

      if (willBeOnAgenda && !wasOnAgenda) {
        await moveNodeToAgenda(editingNode.id, patch.category, dates.todayISO, dates.weekStartISO, dates.weekEndISO);
        await updateNode(editingNode.id, { title: patch.title, notes: patch.notes, tags: patch.tags });
      } else if (!willBeOnAgenda && wasOnAgenda) {
        await setNodeExternalStatus(editingNode.id, patch.externalStatus, dates.todayISO);
        await updateNode(editingNode.id, {
          title: patch.title,
          category: patch.category,
          notes: patch.notes,
          tags: patch.tags,
        });
      } else {
        await updateNode(editingNode.id, patch);
      }
      await refreshNodes();
      setEditingNodeId(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <DndContext id="status-board-dnd" sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div>
        {notice && (
          <div className="mb-3 rounded-lg bg-[var(--route-soft)] px-3 py-2 text-xs text-[var(--route)]">{notice}</div>
        )}

        <h1 className="font-display text-lg text-[var(--foreground)]">Pano</h1>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Dış durum kodlarının kanban görünümü — kafandaki gündemi tek bakışta gör. Kartları sürükleyerek ya da
          alttaki hızlı butonlarla sütunlar arasında taşı; Eylem Yönetim Paneli ile aynı veriyi kullanır.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddNode();
          }}
          className="mt-4 flex gap-2"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Yeni eylem adı… (NOT NOW'a düşer)"
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

        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0">
          {KANBAN_STATUS_ORDER.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              nodes={columns[status]}
              busy={busy}
              onMove={handleMoveToStatus}
              onEdit={(nodeId) => setEditingNodeId(nodeId)}
            />
          ))}
        </div>

        {editingNode && (
          <NodeEditPanel key={editingNode.id} node={editingNode} busy={busy} onClose={() => setEditingNodeId(null)} onSave={handleSaveEdit} />
        )}
      </div>

      <DragOverlay>
        {activeDragTitle && (
          <div className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)] shadow-lg backdrop-blur-xl backdrop-saturate-150">
            {activeDragTitle}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
