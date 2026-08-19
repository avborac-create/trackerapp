"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  addDailyMarkEntry,
  addNode,
  closeCurrentWeekAndAdvance,
  deleteDailyMarkEntry,
  getAdjacentWeek,
  getInboxNodes,
  getOrCreateCurrentWeek,
  getWeekByIdAction,
  moveNodeToAgenda,
  reorderWeekNodesBulk,
  setDailyMarkStatus,
  setNodeExternalStatus,
  toggleDailyMark,
  updateNode,
} from "@/app/lib/actions";
import { addDaysISO, DAY_LABELS, getWeekDays, getWeekStart, toISODate } from "@/app/lib/dates";
import { computeWeekStats } from "@/app/lib/stats";
import {
  CATEGORY_ORDER,
  type Category,
  type DailyMarkEntryKind,
  type DailyMarkStatus,
  type ExternalStatus,
  type NodeDTO,
  type WeekDTO,
} from "@/app/lib/types";
import { WeekHeader } from "@/app/components/WeekHeader";
import { SummaryPanel } from "@/app/components/SummaryPanel";
import { Drawer } from "@/app/components/Drawer";
import { NodeEditPanel } from "@/app/components/NodeEditPanel";
import { DayNoteModal } from "@/app/components/DayNoteModal";
import { HabitsSubNav } from "@/app/components/HabitsSubNav";
import { HabitsTable } from "@/app/components/HabitsTable";
import { HabitsStrip } from "@/app/components/HabitsStrip";
import { getDayBadgeStyle, getHabitsViewMode, type DayBadgeStyle, type HabitsViewMode } from "@/app/lib/prefs";

export function TrackerApp({ initialWeekId }: { initialWeekId?: string }) {
  const [ready, setReady] = useState(false);
  const [todayISO, setTodayISO] = useState("");
  const [weekStartISO, setWeekStartISO] = useState("");
  const [weekEndISO, setWeekEndISO] = useState("");

  const [week, setWeek] = useState<WeekDTO | null>(null);
  const [inboxNodes, setInboxNodes] = useState<NodeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const autoRetriedRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingDayNote, setEditingDayNote] = useState<{ weekNodeId: string; day: string } | null>(null);
  const [activeDragTitle, setActiveDragTitle] = useState<string | null>(null);
  const [collapsedMap, setCollapsedMap] = useState<Record<Category, boolean>>({
    companion: false,
    multi: false,
    active: false,
    passive: false,
  });
  const [habitsView, setHabitsView] = useState<HabitsViewMode>("table");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dayBadgeStyle, setDayBadgeStyle] = useState<DayBadgeStyle>("corner");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    const now = new Date();
    const start = getWeekStart(now);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    setTodayISO(toISODate(now));
    setWeekStartISO(toISODate(start));
    setWeekEndISO(toISODate(end));
    setReady(true);

    const stored: Partial<Record<Category, boolean>> = {};
    for (const cat of CATEGORY_ORDER) {
      stored[cat] = window.localStorage.getItem(`tracker_cluster_collapsed_${cat}`) === "1";
    }
    setCollapsedMap((prev) => ({ ...prev, ...stored }));
    setHabitsView(getHabitsViewMode());
    setDayBadgeStyle(getDayBadgeStyle());
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    setSelectedDay(null);
    const weekPromise = initialWeekId
      ? getWeekByIdAction(initialWeekId).then((w) => w ?? getOrCreateCurrentWeek(weekStartISO, weekEndISO))
      : getOrCreateCurrentWeek(weekStartISO, weekEndISO);
    Promise.all([weekPromise, getInboxNodes()])
      .then(([w, nodes]) => {
        if (cancelled) return;
        autoRetriedRef.current = false;
        setWeek(w);
        setInboxNodes(nodes);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        // Neon veritabanı boşta kalınca uykuya geçiyor; ilk sorgu genelde
        // uyandırma gecikmesiyle başarısız olur — ekranı "yükleniyor"da
        // tutup sessizce bir kez daha dene, kullanıcıya hata göstermeden önce.
        if (!autoRetriedRef.current) {
          autoRetriedRef.current = true;
          setTimeout(() => !cancelled && setRetryKey((k) => k + 1), 2000);
          return;
        }
        setLoadError(true);
        setNotice("Veriler yüklenemedi. Sunucuya ulaşılamıyor olabilir.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, weekStartISO, weekEndISO, retryKey]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  const weekDays = useMemo(() => (week ? getWeekDays(week.startsOn) : []), [week]);
  const stats = useMemo(() => (week ? computeWeekStats(week) : null), [week]);
  const editable = week?.state === "open";
  const isCurrentWeek = week?.startsOn === weekStartISO;

  function toggleClusterCollapsed(category: Category) {
    setCollapsedMap((prev) => {
      const next = { ...prev, [category]: !prev[category] };
      window.localStorage.setItem(`tracker_cluster_collapsed_${category}`, next[category] ? "1" : "0");
      return next;
    });
  }

  function setAllClustersCollapsed(collapsed: boolean) {
    const next: Record<Category, boolean> = {
      companion: collapsed,
      multi: collapsed,
      active: collapsed,
      passive: collapsed,
    };
    for (const cat of CATEGORY_ORDER) {
      window.localStorage.setItem(`tracker_cluster_collapsed_${cat}`, collapsed ? "1" : "0");
    }
    setCollapsedMap(next);
  }

  async function refreshInbox() {
    const nodes = await getInboxNodes();
    setInboxNodes(nodes);
  }

  function withMark(marks: Record<string, DailyMarkStatus>, day: string, status: DailyMarkStatus | null) {
    const next = { ...marks };
    if (status) next[day] = status;
    else delete next[day];
    return next;
  }

  function applyMark(weekNodeId: string, day: string, status: DailyMarkStatus | null) {
    setWeek((w) =>
      w
        ? {
            ...w,
            weekNodes: w.weekNodes.map((x) => (x.id === weekNodeId ? { ...x, marks: withMark(x.marks, day, status) } : x)),
          }
        : w
    );
  }

  function handleToggleDay(weekNodeId: string, day: string) {
    if (!editable || !week) return;
    const wn = week.weekNodes.find((x) => x.id === weekNodeId);
    if (!wn) return;
    const prev = wn.marks[day] ?? null;
    const optimisticNext: DailyMarkStatus | null = prev === "done" ? null : "done";
    applyMark(weekNodeId, day, optimisticNext);

    toggleDailyMark(weekNodeId, day)
      .then((result) => {
        applyMark(weekNodeId, result.day, result.status);
      })
      .catch(() => {
        applyMark(weekNodeId, day, prev);
        setNotice("İşaret kaydedilemedi, tekrar dene.");
      });
  }

  function handleSetDayStatus(weekNodeId: string, day: string, status: DailyMarkStatus | null) {
    if (!editable || !week) return;
    const wn = week.weekNodes.find((x) => x.id === weekNodeId);
    if (!wn) return;
    const prev = wn.marks[day] ?? null;
    applyMark(weekNodeId, day, status);

    setDailyMarkStatus(weekNodeId, day, status)
      .then((result) => {
        applyMark(weekNodeId, result.day, result.status);
      })
      .catch(() => {
        applyMark(weekNodeId, day, prev);
        setNotice("İşaret kaydedilemedi, tekrar dene.");
      });
  }

  async function handlePrev() {
    if (!week) return;
    setBusy(true);
    try {
      const prev = await getAdjacentWeek(week.startsOn, "prev");
      if (prev) setWeek(prev);
      else setNotice("Daha eski hafta yok.");
    } finally {
      setBusy(false);
    }
  }

  async function handleNext() {
    if (!week) return;
    setBusy(true);
    try {
      const next = await getAdjacentWeek(week.startsOn, "next");
      if (next) {
        setWeek(next);
      } else if (week.state === "open") {
        setNotice("Sonraki hafta henüz yok.");
      } else {
        setWeek(await getOrCreateCurrentWeek(weekStartISO, weekEndISO));
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleClose() {
    if (!week) return;
    setBusy(true);
    try {
      const nextStart = addDaysISO(week.endsOn, 1);
      const nextEnd = addDaysISO(nextStart, 6);
      const newWeek = await closeCurrentWeekAndAdvance(week.id, nextStart, nextEnd);
      setWeek(newWeek);
    } finally {
      setBusy(false);
    }
  }

  async function handleAddNode(title: string) {
    setBusy(true);
    try {
      await addNode(title);
      await refreshInbox();
    } finally {
      setBusy(false);
    }
  }

  async function handleMoveToAgenda(nodeId: string, category: Category) {
    setBusy(true);
    try {
      const w = await moveNodeToAgenda(nodeId, category, todayISO, weekStartISO, weekEndISO);
      setWeek(w);
      await refreshInbox();
    } finally {
      setBusy(false);
    }
  }

  async function handleSetStatus(nodeId: string, status: "inbox" | "not_now" | "closed") {
    setBusy(true);
    try {
      await setNodeExternalStatus(nodeId, status, todayISO);
      await refreshInbox();
      setWeek((w) => (w ? { ...w, weekNodes: w.weekNodes.filter((x) => x.nodeId !== nodeId) } : w));
    } finally {
      setBusy(false);
    }
  }

  async function handleChangeCategory(nodeId: string, category: Category) {
    setBusy(true);
    try {
      await updateNode(nodeId, { category });
      setWeek((w) =>
        w ? { ...w, weekNodes: w.weekNodes.map((x) => (x.nodeId === nodeId ? { ...x, category } : x)) } : w
      );
    } finally {
      setBusy(false);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as { title?: string } | undefined;
    setActiveDragTitle(data?.title ?? null);
  }

  async function handleReorderWeekNodes(category: Category, activeWeekNodeId: string, targetWeekNodeId: string) {
    if (!week) return;
    const categoryNodes = week.weekNodes
      .filter((wn) => wn.category === category)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const oldIndex = categoryNodes.findIndex((wn) => wn.id === activeWeekNodeId);
    const newIndex = categoryNodes.findIndex((wn) => wn.id === targetWeekNodeId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const reordered = arrayMove(categoryNodes, oldIndex, newIndex);
    const sortOrders = categoryNodes.map((wn) => wn.sortOrder).sort((a, b) => a - b);
    const prevWeek = week;

    setWeek((w) =>
      w
        ? {
            ...w,
            weekNodes: w.weekNodes.map((wn) => {
              const idx = reordered.findIndex((r) => r.id === wn.id);
              return idx === -1 ? wn : { ...wn, sortOrder: sortOrders[idx] };
            }),
          }
        : w
    );
    await reorderWeekNodesBulk(reordered.map((wn) => wn.id)).catch(() => setWeek(prevWeek));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragTitle(null);
    const { active, over } = event;
    if (!over || !editable) return;
    const data = active.data.current as
      | { kind: "agenda"; nodeId: string; category: Category }
      | { kind: "drawer"; nodeId: string; status: "inbox" | "not_now" | "closed" }
      | undefined;
    if (!data) return;
    const overId = String(over.id);

    if (overId === "drawer-panel") {
      if (data.kind === "drawer" && data.status === "inbox") return;
      handleSetStatus(data.nodeId, "inbox");
      return;
    }

    if (overId.startsWith("cluster-")) {
      const targetCategory = overId.slice("cluster-".length) as Category;
      if (data.kind === "agenda") {
        if (data.category === targetCategory) return;
        handleChangeCategory(data.nodeId, targetCategory);
      } else {
        handleMoveToAgenda(data.nodeId, targetCategory);
      }
      return;
    }

    if (overId.startsWith("drawer-")) {
      const targetStatus = overId.slice("drawer-".length) as "inbox" | "not_now" | "closed";
      if (data.kind === "drawer" && data.status === targetStatus) return;
      handleSetStatus(data.nodeId, targetStatus);
      return;
    }

    if (overId.startsWith("agenda-") && data.kind === "agenda") {
      const activeWeekNodeId = String(active.id).slice("agenda-".length);
      const targetWeekNodeId = overId.slice("agenda-".length);
      if (activeWeekNodeId === targetWeekNodeId) return;
      const targetNode = week?.weekNodes.find((wn) => wn.id === targetWeekNodeId);
      if (!targetNode) return;
      if (targetNode.category === data.category) {
        handleReorderWeekNodes(data.category, activeWeekNodeId, targetWeekNodeId);
      } else {
        handleChangeCategory(data.nodeId, targetNode.category);
      }
    }
  }

  const editingFromInbox = inboxNodes.find((n) => n.id === editingNodeId);
  const editingFromWeek = week?.weekNodes.find((wn) => wn.nodeId === editingNodeId);
  const editingNode: NodeDTO | null = editingFromInbox
    ? editingFromInbox
    : editingFromWeek
      ? {
          id: editingFromWeek.nodeId,
          title: editingFromWeek.title,
          category: editingFromWeek.category,
          externalStatus: "on_agenda",
          notes: editingFromWeek.notes,
          tags: editingFromWeek.tags,
          createdAt: "",
        }
      : null;

  async function handleSaveEdit(patch: {
    title: string;
    category: Category;
    externalStatus: ExternalStatus;
    notes: string | null;
    tags: string[];
  }) {
    if (!editingNode) return;
    setBusy(true);
    try {
      const wasOnAgenda = editingNode.externalStatus === "on_agenda";
      const willBeOnAgenda = patch.externalStatus === "on_agenda";

      if (willBeOnAgenda && !wasOnAgenda) {
        const w = await moveNodeToAgenda(editingNode.id, patch.category, todayISO, weekStartISO, weekEndISO);
        setWeek(w);
        await updateNode(editingNode.id, { title: patch.title, notes: patch.notes, tags: patch.tags });
      } else if (!willBeOnAgenda && wasOnAgenda) {
        await setNodeExternalStatus(editingNode.id, patch.externalStatus, todayISO);
        await updateNode(editingNode.id, {
          title: patch.title,
          category: patch.category,
          notes: patch.notes,
          tags: patch.tags,
        });
        setWeek((w) => (w ? { ...w, weekNodes: w.weekNodes.filter((x) => x.nodeId !== editingNode.id) } : w));
      } else {
        await updateNode(editingNode.id, patch);
        if (wasOnAgenda) {
          setWeek((w) =>
            w
              ? {
                  ...w,
                  weekNodes: w.weekNodes.map((x) =>
                    x.nodeId === editingNode.id
                      ? { ...x, title: patch.title, category: patch.category, notes: patch.notes, tags: patch.tags }
                      : x
                  ),
                }
              : w
          );
        }
      }
      await refreshInbox();
      setEditingNodeId(null);
    } finally {
      setBusy(false);
    }
  }

  function handleStopNode(nodeId: string) {
    handleSetStatus(nodeId, "not_now");
  }

  async function handleAddDayEntry(text: string, kind: DailyMarkEntryKind) {
    if (!editingDayNote) return;
    const { weekNodeId, day } = editingDayNote;
    setBusy(true);
    try {
      const result = await addDailyMarkEntry(weekNodeId, day, text, kind);
      setWeek((w) =>
        w
          ? {
              ...w,
              weekNodes: w.weekNodes.map((x) =>
                x.id === weekNodeId
                  ? {
                      ...x,
                      marks: withMark(x.marks, result.day, result.status),
                      dayEntries: {
                        ...x.dayEntries,
                        [result.day]: [...(x.dayEntries[result.day] ?? []), result.entry],
                      },
                    }
                  : x
              ),
            }
          : w
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteDayEntry(entryId: string) {
    if (!editingDayNote) return;
    const { weekNodeId, day } = editingDayNote;
    setBusy(true);
    try {
      await deleteDailyMarkEntry(weekNodeId, day, entryId);
      setWeek((w) =>
        w
          ? {
              ...w,
              weekNodes: w.weekNodes.map((x) =>
                x.id === weekNodeId
                  ? {
                      ...x,
                      dayEntries: {
                        ...x.dayEntries,
                        [day]: (x.dayEntries[day] ?? []).filter((e) => e.id !== entryId),
                      },
                    }
                  : x
              ),
            }
          : w
      );
    } finally {
      setBusy(false);
    }
  }

  const dayNoteWeekNode = editingDayNote
    ? week?.weekNodes.find((x) => x.id === editingDayNote.weekNodeId)
    : undefined;
  const dayNoteDayIndex = editingDayNote ? weekDays.indexOf(editingDayNote.day) : -1;
  const dayNoteEntries = (editingDayNote && dayNoteWeekNode?.dayEntries[editingDayNote.day]) || [];

  if (!ready || loading) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl items-center justify-center bg-[var(--background)] px-4 py-24 text-sm text-[var(--muted)]">
        Yükleniyor…
      </div>
    );
  }

  if (loadError || !week || !stats) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col items-center justify-center gap-3 bg-[var(--background)] px-4 py-24 text-center">
        <p className="text-sm text-[var(--muted)]">
          Veriler yüklenemedi. Sunucuya ulaşılamıyor olabilir.
        </p>
        <button
          type="button"
          onClick={() => setRetryKey((k) => k + 1)}
          className="rounded-full bg-[var(--compass)] px-4 py-1.5 text-xs font-medium text-[var(--compass-soft)] shadow-sm"
        >
          Tekrar dene
        </button>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-4">
      {notice && (
        <div className="mb-3 rounded-lg bg-[var(--route-soft)] px-3 py-2 text-xs text-[var(--route)]">
          {notice}
        </div>
      )}

      <HabitsSubNav />

      <WeekHeader
        weekStartISO={week.startsOn}
        weekEndISO={week.endsOn}
        weekDays={weekDays}
        todayISO={todayISO}
        isCurrentWeek={isCurrentWeek}
        isOpen={week.state === "open"}
        hasPrev
        hasNext
        onPrev={handlePrev}
        onNext={handleNext}
        onClose={handleClose}
        busy={busy}
        selectedDay={selectedDay}
        onSelectDay={(day) => setSelectedDay(day || null)}
      />

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_360px]">
        <div className="space-y-2.5">
          <div className="flex justify-end gap-1.5 px-1">
            <button
              type="button"
              onClick={() => setAllClustersCollapsed(false)}
              className="rounded-full px-2.5 py-1 text-[11px] font-medium text-[var(--muted)] hover:bg-[var(--surface-2)]"
            >
              Tümünü genişlet
            </button>
            <button
              type="button"
              onClick={() => setAllClustersCollapsed(true)}
              className="rounded-full px-2.5 py-1 text-[11px] font-medium text-[var(--muted)] hover:bg-[var(--surface-2)]"
            >
              Tümünü daralt
            </button>
          </div>
          {(() => {
            const HabitsView = habitsView === "strip" ? HabitsStrip : HabitsTable;
            return (
              <HabitsView
                week={week}
                weekDays={weekDays}
                stats={stats}
                editable={editable}
                badgeStyle={dayBadgeStyle}
                collapsedMap={collapsedMap}
                onToggleCollapsed={toggleClusterCollapsed}
                selectedDay={selectedDay}
                onToggleDay={handleToggleDay}
                onSetDayStatus={handleSetDayStatus}
                onOpenDayNote={(weekNodeId, day) => setEditingDayNote({ weekNodeId, day })}
                onEditNode={(weekNodeId) => {
                  const wn = week.weekNodes.find((x) => x.id === weekNodeId);
                  if (wn) setEditingNodeId(wn.nodeId);
                }}
                onStopNode={(weekNodeId) => {
                  const wn = week.weekNodes.find((x) => x.id === weekNodeId);
                  if (wn) handleStopNode(wn.nodeId);
                }}
              />
            );
          })()}
        </div>

        <div className="space-y-4">
          <SummaryPanel stats={stats} />
        </div>
      </div>

      <div className="mt-4">
        <Drawer
          nodes={inboxNodes}
          editable={editable}
          busy={busy}
          onAddNode={handleAddNode}
          onMoveToAgenda={handleMoveToAgenda}
          onSetStatus={handleSetStatus}
          onEditNode={(nodeId) => setEditingNodeId(nodeId)}
        />
      </div>

      {editingNode && (
        <NodeEditPanel
          key={editingNode.id}
          node={editingNode}
          busy={busy}
          onClose={() => setEditingNodeId(null)}
          onSave={handleSaveEdit}
        />
      )}

      {editingDayNote && dayNoteWeekNode && (
        <DayNoteModal
          title={dayNoteWeekNode.title}
          dayLabel={dayNoteDayIndex >= 0 ? DAY_LABELS[dayNoteDayIndex] : ""}
          entries={dayNoteEntries}
          busy={busy}
          onClose={() => setEditingDayNote(null)}
          onAdd={handleAddDayEntry}
          onDelete={handleDeleteDayEntry}
        />
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
