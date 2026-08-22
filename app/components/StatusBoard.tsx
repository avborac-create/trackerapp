"use client";

import { useEffect, useMemo, useState } from "react";
import { Kalam } from "next/font/google";
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

// El yazısı marker hissi: fiziksel beyaz tahtadaki post-it panosunun dijital
// karşılığı. Türkçe karakterler için latin-ext gerekli.
const kalam = Kalam({ subsets: ["latin", "latin-ext"], weight: ["400", "700"] });

const COLUMN_HINTS: Record<ExternalStatus, string> = {
  inbox: "Henüz karar verilmedi",
  on_agenda: "Bu hafta aktif takipte",
  not_now: "Açık ama duraklatıldı",
  closed: "Döngüden çıkarıldı",
};

// Fiziksel panodaki elle çizilmiş, hafif eğri dikdörtgen çerçeve hissi —
// sütun başına sabit (render'da zıplamasın diye), asimetrik border-radius +
// hafif döndürme ile taklit edilir.
const COLUMN_SKETCH: Record<ExternalStatus, string> = {
  inbox: "22px 8px 20px 10px / 10px 20px 8px 22px",
  on_agenda: "10px 22px 10px 24px / 22px 10px 24px 10px",
  not_now: "24px 10px 18px 12px / 12px 24px 10px 18px",
  closed: "12px 20px 14px 22px / 20px 12px 22px 14px",
};
const COLUMN_TILT: Record<ExternalStatus, string> = {
  inbox: "rotate-[-0.35deg]",
  on_agenda: "rotate-[0.3deg]",
  not_now: "rotate-[-0.25deg]",
  closed: "rotate-[0.4deg]",
};

/** Post-it'in kart id'sine göre sabit, tekrar üretilebilir hafif eğimi —
 * yeniden render'da not zıplamasın diye rastgele değil, hash tabanlı. */
function noteRotation(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 700) / 100) * (h % 2 === 0 ? 1 : -1) - 3.5;
}

const NOTE_BG =
  "linear-gradient(160deg, #eef97a 0%, #d7e34a 55%, #c7d43a 100%)";

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
  const rotation = noteRotation(node.id);

  return (
    <li
      ref={setNodeRef}
      style={{
        background: NOTE_BG,
        transform: isDragging ? "rotate(0deg) scale(1.05)" : `rotate(${rotation}deg)`,
      }}
      className={`group relative min-h-[6.5rem] rounded-[3px] p-2.5 pt-4 shadow-[2px_4px_10px_rgba(0,0,0,0.35)] transition-transform hover:z-10 hover:-translate-y-0.5 ${
        isDragging ? "z-50 opacity-90 shadow-[4px_10px_22px_rgba(0,0,0,0.5)]" : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute -top-2 left-1/2 -translate-x-1/2 cursor-grab touch-none text-base leading-none opacity-80 active:cursor-grabbing"
        aria-label="Sürükle"
        title="Sürükleyerek taşı"
      >
        📌
      </button>

      <button
        type="button"
        onClick={onEdit}
        className={`${kalam.className} block w-full text-left text-[15px] font-bold leading-tight text-[#1f2410] hover:underline`}
      >
        {node.externalStatus === "on_agenda" && (
          <span className={`mr-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${theme.dot}`} aria-hidden />
        )}
        {node.title}
      </button>

      {node.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {node.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-black/10 px-1.5 py-0.5 text-[9px] font-medium text-[#1f2410]/70"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {otherStatuses.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy}
            onClick={() => onMove(s)}
            className="rounded-full bg-black/15 px-1.5 py-0.5 text-[9px] font-semibold text-[#1f2410] hover:bg-black/25 disabled:opacity-40"
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
      style={{ borderRadius: COLUMN_SKETCH[status] }}
      className={`flex min-w-[80%] shrink-0 snap-start flex-col border-2 p-3 pt-2.5 transition-colors sm:min-w-0 sm:shrink ${
        COLUMN_TILT[status]
      } ${isOver ? "border-[var(--foreground)] bg-white/[0.04]" : "border-[var(--border-strong)]"}`}
    >
      <h2 className="flex items-baseline justify-between px-1">
        <span className={`${kalam.className} text-xl font-bold tracking-wide text-[var(--foreground)]`}>
          {KANBAN_STATUS_LABELS[status]}
        </span>
        <span className="text-xs tabular-nums text-[var(--muted)]">{nodes.length}</span>
      </h2>
      <p className="px-1 text-[11px] text-[var(--muted)] opacity-70">{COLUMN_HINTS[status]}</p>

      <ul className="mt-3 grid min-h-[4rem] flex-1 grid-cols-2 content-start gap-x-2.5 gap-y-4">
        {nodes.length === 0 ? (
          <li className="col-span-2 px-1 text-xs text-[var(--muted)] opacity-60">
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
          Dış durum kodlarının kanban görünümü — kafandaki gündemi tek bakışta gör. Notları sürükleyerek ya da
          üzerine gelince çıkan hızlı butonlarla sütunlar arasında taşı; Eylem Yönetim Paneli ile aynı veriyi kullanır.
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

        <div className="mt-5 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0">
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
          <div
            style={{ background: NOTE_BG }}
            className={`${kalam.className} rounded-[3px] px-3 py-2.5 text-[15px] font-bold text-[#1f2410] shadow-[4px_10px_22px_rgba(0,0,0,0.5)]`}
          >
            {activeDragTitle}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
