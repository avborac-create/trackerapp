"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addNode,
  closeCurrentWeekAndAdvance,
  getAdjacentWeek,
  getInboxNodes,
  getOrCreateCurrentWeek,
  getWeekByIdAction,
  moveNodeToAgenda,
  setNodeExternalStatus,
  toggleDailyMark,
  updateNode,
} from "@/app/lib/actions";
import { addDaysISO, getWeekDays, getWeekStart, toISODate } from "@/app/lib/dates";
import { computeWeekStats } from "@/app/lib/stats";
import { CATEGORY_ORDER, type Category, type ExternalStatus, type NodeDTO, type WeekDTO } from "@/app/lib/types";
import { WeekHeader } from "@/app/components/WeekHeader";
import { CategoryCluster } from "@/app/components/CategoryCluster";
import { SummaryPanel } from "@/app/components/SummaryPanel";
import { Drawer } from "@/app/components/Drawer";
import { NodeEditPanel } from "@/app/components/NodeEditPanel";

export function TrackerApp({ initialWeekId }: { initialWeekId?: string }) {
  const [ready, setReady] = useState(false);
  const [todayISO, setTodayISO] = useState("");
  const [weekStartISO, setWeekStartISO] = useState("");
  const [weekEndISO, setWeekEndISO] = useState("");

  const [week, setWeek] = useState<WeekDTO | null>(null);
  const [inboxNodes, setInboxNodes] = useState<NodeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const start = getWeekStart(now);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    setTodayISO(toISODate(now));
    setWeekStartISO(toISODate(start));
    setWeekEndISO(toISODate(end));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    const weekPromise = initialWeekId
      ? getWeekByIdAction(initialWeekId).then((w) => w ?? getOrCreateCurrentWeek(weekStartISO, weekEndISO))
      : getOrCreateCurrentWeek(weekStartISO, weekEndISO);
    Promise.all([weekPromise, getInboxNodes()])
      .then(([w, nodes]) => {
        if (cancelled) return;
        setWeek(w);
        setInboxNodes(nodes);
      })
      .catch(() => !cancelled && setNotice("Veriler yüklenemedi."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, weekStartISO, weekEndISO]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  const weekDays = useMemo(() => (week ? getWeekDays(week.startsOn) : []), [week]);
  const stats = useMemo(() => (week ? computeWeekStats(week) : null), [week]);
  const editable = week?.state === "open";
  const isCurrentWeek = week?.startsOn === weekStartISO;

  async function refreshInbox() {
    const nodes = await getInboxNodes();
    setInboxNodes(nodes);
  }

  function handleToggleDay(weekNodeId: string, day: string) {
    if (!editable || !week) return;
    const wn = week.weekNodes.find((x) => x.id === weekNodeId);
    if (!wn) return;
    const prev = !!wn.marks[day];

    setWeek((w) =>
      w
        ? {
            ...w,
            weekNodes: w.weekNodes.map((x) =>
              x.id === weekNodeId ? { ...x, marks: { ...x.marks, [day]: !prev } } : x
            ),
          }
        : w
    );

    toggleDailyMark(weekNodeId, day)
      .then((result) => {
        setWeek((w) =>
          w
            ? {
                ...w,
                weekNodes: w.weekNodes.map((x) =>
                  x.id === weekNodeId ? { ...x, marks: { ...x.marks, [result.day]: result.completed } } : x
                ),
              }
            : w
        );
      })
      .catch(() => {
        setWeek((w) =>
          w
            ? {
                ...w,
                weekNodes: w.weekNodes.map((x) =>
                  x.id === weekNodeId ? { ...x, marks: { ...x.marks, [day]: prev } } : x
                ),
              }
            : w
        );
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

  async function handleSetStatus(nodeId: string, status: "not_now" | "closed") {
    setBusy(true);
    try {
      await setNodeExternalStatus(nodeId, status, todayISO);
      await refreshInbox();
      setWeek((w) => (w ? { ...w, weekNodes: w.weekNodes.filter((x) => x.nodeId !== nodeId) } : w));
    } finally {
      setBusy(false);
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
          createdAt: "",
        }
      : null;

  async function handleSaveEdit(patch: { title: string; category: Category; externalStatus: ExternalStatus }) {
    if (!editingNode) return;
    setBusy(true);
    try {
      const wasOnAgenda = editingNode.externalStatus === "on_agenda";
      const willBeOnAgenda = patch.externalStatus === "on_agenda";

      if (willBeOnAgenda && !wasOnAgenda) {
        const w = await moveNodeToAgenda(editingNode.id, patch.category, todayISO, weekStartISO, weekEndISO);
        setWeek(w);
        if (patch.title !== editingNode.title) await updateNode(editingNode.id, { title: patch.title });
      } else if (!willBeOnAgenda && wasOnAgenda) {
        await setNodeExternalStatus(editingNode.id, patch.externalStatus, todayISO);
        await updateNode(editingNode.id, { title: patch.title, category: patch.category });
        setWeek((w) => (w ? { ...w, weekNodes: w.weekNodes.filter((x) => x.nodeId !== editingNode.id) } : w));
      } else {
        await updateNode(editingNode.id, patch);
        if (wasOnAgenda) {
          setWeek((w) =>
            w
              ? {
                  ...w,
                  weekNodes: w.weekNodes.map((x) =>
                    x.nodeId === editingNode.id ? { ...x, title: patch.title, category: patch.category } : x
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

  if (!ready || loading || !week || !stats) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-24 text-sm text-neutral-400">
        Yükleniyor…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6">
      {notice && (
        <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          {notice}
        </div>
      )}

      <WeekHeader
        weekStartISO={week.startsOn}
        weekEndISO={week.endsOn}
        isCurrentWeek={isCurrentWeek}
        isOpen={week.state === "open"}
        hasPrev
        hasNext
        onPrev={handlePrev}
        onNext={handleNext}
        onClose={handleClose}
        busy={busy}
      />

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {CATEGORY_ORDER.map((cat) => (
            <CategoryCluster
              key={cat}
              category={cat}
              weekNodes={week.weekNodes.filter((wn) => wn.category === cat)}
              weekDays={weekDays}
              stats={stats}
              editable={editable}
              onToggleDay={handleToggleDay}
              onEditNode={(weekNodeId) => {
                const wn = week.weekNodes.find((x) => x.id === weekNodeId);
                if (wn) setEditingNodeId(wn.nodeId);
              }}
            />
          ))}
        </div>

        <div className="space-y-4">
          <SummaryPanel stats={stats} />
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
      </div>

      {editingNode && (
        <NodeEditPanel
          node={editingNode}
          busy={busy}
          onClose={() => setEditingNodeId(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
