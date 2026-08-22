"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  getBoardColumnSizes,
  getBoardPositions,
  getBoardStyle,
  setBoardColumnSize,
  setBoardPosition,
  BOARD_STYLE_KEY,
  type BoardColumnSize,
  type BoardPosition,
  type BoardStyle,
} from "@/app/lib/prefs";
import {
  KANBAN_STATUS_LABELS,
  KANBAN_STATUS_ORDER,
  type Category,
  type ExternalStatus,
  type NodeDTO,
} from "@/app/lib/types";
import { NodeEditPanel } from "@/app/components/NodeEditPanel";

// "Sticky" moddaki el yazısı hissi için. Türkçe karakterler için latin-ext gerekli.
const kalam = Kalam({ subsets: ["latin", "latin-ext"], weight: ["400", "700"] });

const INK = "#20202a";
const INK_MUTED = "rgba(32,32,42,0.62)";

// Notların varsayılan (hiç sürüklenmemiş) yerleşimi — eski 2 sütunlu ızgarayla
// aynı görünümü verir, ama artık yalnızca bir başlangıç noktası: sürükleyince
// serbestçe her yere bırakılabilir.
const CARD_WIDTH = 136;
const CELL_W = 148;
const CELL_H = 96;
const COLUMN_PADDING = 12;
const DEFAULT_COLUMN_WIDTH = 300;
const DEFAULT_COLUMN_HEIGHT = 340;

function defaultCardPosition(index: number): BoardPosition {
  return { x: (index % 2) * CELL_W, y: Math.floor(index / 2) * CELL_H };
}

// Sütun zemin rengi — dış duruma göre (kullanıcının Canva panosuyla birebir).
const COLUMN_BG: Record<ExternalStatus, string> = {
  inbox: "#d6d6da",
  on_agenda: "#9ec2fb",
  not_now: "#ddc9f7",
  closed: "#a3e6c1",
};

// Not rengi — iç kategoriye göre (kullanıcının Canva panosuyla birebir).
const CATEGORY_CARD_BG: Record<Category, string> = {
  companion: "#c9adf7",
  multi: "#ffe066",
  active: "#ff9db0",
  passive: "#7fe3ac",
};

/** Post-it'in kart id'sine göre sabit, tekrar üretilebilir hafif eğimi —
 * yeniden render'da not zıplamasın diye rastgele değil, hash tabanlı. */
function noteRotation(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 700) / 100) * (h % 2 === 0 ? 1 : -1) - 3.5;
}

function BoardCard({
  node,
  position,
  sticky,
  onEdit,
}: {
  node: NodeDTO;
  position: BoardPosition;
  sticky: boolean;
  onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `board-card-${node.id}`,
    data: { nodeId: node.id, status: node.externalStatus, title: node.title },
  });
  const rotation = sticky ? noteRotation(node.id) : 0;

  // Canva'daki gibi: not kağıdının HERHANGİ bir noktasından tutup sürükle;
  // dnd-kit'in aktivasyon mesafesi (8px) aşılmadan bırakılan bir tıklama,
  // sürükleme başlatmadan normal onClick olarak geçer — bu yüzden ayrı bir
  // tutamaç ikonuna gerek yok, aynı öğe hem sürüklenebilir hem tıklanabilir.
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onEdit}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: CARD_WIDTH,
        background: CATEGORY_CARD_BG[node.category],
        color: INK,
        transform: isDragging ? "rotate(0deg) scale(1.05)" : `rotate(${rotation}deg)`,
      }}
      className={`cursor-grab touch-none rounded-lg p-2 text-xs shadow-sm transition-shadow hover:z-10 hover:shadow-md active:cursor-grabbing ${
        sticky ? "pt-4" : ""
      } ${isDragging ? "z-50 opacity-90 shadow-lg" : ""}`}
    >
      {sticky && (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 text-sm leading-none opacity-80"
        >
          📌
        </span>
      )}

      <p className={`font-bold uppercase leading-tight ${sticky ? kalam.className : ""}`}>{node.title}</p>

      {node.tags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {node.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-black/10 px-1.5 py-0.5 text-[9px] font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}
    </li>
  );
}

function BoardColumn({
  status,
  nodes,
  positions,
  sticky,
  initialSize,
  onEdit,
}: {
  status: ExternalStatus;
  nodes: NodeDTO[];
  positions: Record<string, BoardPosition>;
  sticky: boolean;
  initialSize: BoardColumnSize | undefined;
  onEdit: (nodeId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `board-col-${status}` });
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<BoardColumnSize>(
    initialSize ?? { width: DEFAULT_COLUMN_WIDTH, height: DEFAULT_COLUMN_HEIGHT }
  );

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      // entry.contentRect padding hariç iç kutuyu verir; style.width ise
      // (border-box) padding dahil dış kutuyu temsil eder — offsetWidth/
      // offsetHeight kullanmak bu birim uyuşmazlığını (ve her seferinde
      // padding kadar küçülen geri besleme döngüsünü) önler.
      const next = { width: el.offsetWidth, height: el.offsetHeight };
      setSize((prev) => {
        if (Math.abs(prev.width - next.width) < 2 && Math.abs(prev.height - next.height) < 2) return prev;
        setBoardColumnSize(status, next);
        return next;
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [status]);

  return (
    <div className="flex shrink-0 snap-start flex-col items-start">
      <h2 className="mb-2 px-1 font-display text-sm font-extrabold uppercase tracking-wide text-[var(--foreground)]">
        {KANBAN_STATUS_LABELS[status]} <span className="font-normal text-[var(--muted)]">({nodes.length})</span>
      </h2>

      <div
        ref={(el) => {
          boxRef.current = el;
          setNodeRef(el);
        }}
        style={{
          background: COLUMN_BG[status],
          outline: isOver ? `2px solid ${INK}` : "none",
          width: size.width,
          height: size.height,
          minWidth: 180,
          minHeight: 160,
          maxWidth: "85vw",
        }}
        className="scrollbar-apple relative resize-none overflow-auto rounded-2xl p-3 transition-shadow sm:resize"
      >
        {nodes.length === 0 ? (
          <p className="px-1 text-xs" style={{ color: INK_MUTED }}>
            {isOver ? "Buraya bırak" : "—"}
          </p>
        ) : (
          <ul className="relative">
            {nodes.map((n, i) => (
              <BoardCard
                key={n.id}
                node={n}
                position={positions[n.id] ?? defaultCardPosition(i)}
                sticky={sticky}
                onEdit={() => onEdit(n.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function StatusBoard({ initialNodes }: { initialNodes: NodeDTO[] }) {
  const [nodes, setNodes] = useState<NodeDTO[]>(initialNodes);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [activeDragTitle, setActiveDragTitle] = useState<{ title: string; category: Category } | null>(null);
  const [dates, setDates] = useState<{ todayISO: string; weekStartISO: string; weekEndISO: string } | null>(null);
  const [boardStyle, setBoardStyleState] = useState<BoardStyle>("flat");
  const [positions, setPositions] = useState<Record<string, BoardPosition>>({});
  const [columnSizes, setColumnSizes] = useState<Record<string, BoardColumnSize>>({});
  const sticky = boardStyle === "sticky";

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    const now = new Date();
    const start = getWeekStart(now);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    setDates({ todayISO: toISODate(now), weekStartISO: toISODate(start), weekEndISO: toISODate(end) });
    setBoardStyleState(getBoardStyle());
    setPositions(getBoardPositions());
    setColumnSizes(getBoardColumnSizes());
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  function toggleBoardStyle() {
    const next: BoardStyle = sticky ? "flat" : "sticky";
    setBoardStyleState(next);
    window.localStorage.setItem(BOARD_STYLE_KEY, next);
  }

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
    const data = event.active.data.current as { title?: string; nodeId?: string } | undefined;
    const node = nodes.find((n) => n.id === data?.nodeId);
    setActiveDragTitle(data?.title && node ? { title: data.title, category: node.category } : null);
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

    // Bırakılan sütunun (hedef sütun aynı ya da farklı olabilir) sol-üst
    // köşesine göre serbest konumu hesapla — sürükle-bırak hem konumu hem
    // (sütun değiştiyse) dış durumu tek hareketle günceller.
    const overRect = over.rect;
    const activeRect = active.rect.current.translated ?? active.rect.current.initial;
    if (overRect && activeRect) {
      const nextPos: BoardPosition = {
        x: Math.max(0, Math.round(activeRect.left - overRect.left - COLUMN_PADDING)),
        y: Math.max(0, Math.round(activeRect.top - overRect.top - COLUMN_PADDING)),
      };
      setPositions((prev) => ({ ...prev, [data.nodeId]: nextPos }));
      setBoardPosition(data.nodeId, nextPos);
    }

    if (targetStatus !== data.status) {
      handleMoveToStatus(data.nodeId, targetStatus);
    }
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

        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-lg text-[var(--foreground)]">Pano</h1>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Dış durum kodlarının kanban görünümü — sütun dış durumu, not rengi iç kategoriyi gösterir. Notları
              serbestçe istediğin yere sürükleyebilir, sütunun sağ-alt köşesinden boyutunu değiştirebilirsin;
              Eylem Yönetim Paneli ile aynı veriyi kullanır.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleBoardStyle}
            aria-pressed={sticky}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
              sticky
                ? "border-transparent bg-[var(--foreground)] text-[var(--invert)]"
                : "border-[var(--border-subtle)] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            📌 Post-it hissi
          </button>
        </div>

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
            placeholder="Yeni eylem adı… (Gelen Kutusu'na düşer)"
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

        <div className="scrollbar-apple mt-5 flex items-start gap-4 overflow-x-auto pb-2 snap-x snap-mandatory sm:snap-none">
          {/* Sütunlar, kaydedilmiş boyut/konum localStorage'dan okunana kadar
              (dates hazır olana kadar) render edilmez — aksi halde BoardColumn
              kendi başlangıç boyutunu "henüz gelmemiş" prop ile kilitlerdi. */}
          {dates && KANBAN_STATUS_ORDER.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              nodes={columns[status]}
              positions={positions}
              sticky={sticky}
              initialSize={columnSizes[status]}
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
            style={{ background: CATEGORY_CARD_BG[activeDragTitle.category], color: INK, width: CARD_WIDTH }}
            className={`rounded-lg px-3 py-2 text-xs font-bold uppercase shadow-lg ${sticky ? kalam.className : ""}`}
          >
            {activeDragTitle.title}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
