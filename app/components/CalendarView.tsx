"use client";

import { useMemo, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { addTaskItem, deleteTaskItem, reorderTaskItemsBulk, toggleTaskItem } from "@/app/lib/taskActions";
import { playCompletionChime } from "@/app/lib/sound";
import {
  addDaysISO,
  DAY_LABELS,
  DAY_LABELS_FULL,
  fromISODate,
  MONTHS_TR,
  toISODate,
  weekdayIndex,
} from "@/app/lib/dates";
import { TASK_LIST_LABELS, type TaskItemDTO, type TaskListKey } from "@/app/lib/types";

const ADDABLE_LISTS: TaskListKey[] = ["task", "buylist"];

function dateHeading(iso: string, todayISO: string) {
  const d = fromISODate(iso);
  const dayNum = d.getDate();
  const monthShort = MONTHS_TR[d.getMonth()].slice(0, 3);
  const weekday = DAY_LABELS_FULL[weekdayIndex(d)];
  const tomorrowISO = addDaysISO(todayISO, 1);
  const relative = iso === todayISO ? "Bugün" : iso === tomorrowISO ? "Yarın" : null;
  return relative ? `${dayNum} ${monthShort} · ${relative} · ${weekday}` : `${dayNum} ${monthShort} · ${weekday}`;
}

type ItemRowSortable = {
  setNodeRef: (el: HTMLElement | null) => void;
  style: React.CSSProperties;
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
  isDragging: boolean;
};

type ItemRowBaseProps = {
  item: TaskItemDTO;
  onToggle: () => void;
  onDelete: () => void;
};

function ItemRow({ item, onToggle, onDelete, sortable }: ItemRowBaseProps & { sortable?: ItemRowSortable }) {
  const [celebrate, setCelebrate] = useState(false);

  function handleToggleClick() {
    if (!item.done) {
      playCompletionChime();
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 500);
    }
    onToggle();
  }

  return (
    <li
      ref={sortable?.setNodeRef}
      style={sortable?.style}
      {...sortable?.attributes}
      {...sortable?.listeners}
      className={`flex items-start gap-2 border-b border-[var(--border-subtle)] py-2.5 last:border-0 ${
        sortable ? "cursor-grab active:cursor-grabbing" : ""
      } ${sortable?.isDragging ? "opacity-50" : ""}`}
    >
      <button
        type="button"
        onClick={handleToggleClick}
        aria-pressed={item.done}
        aria-label={item.done ? "Tamamlanmadı işaretle" : "Tamamlandı işaretle"}
        className={`relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
          celebrate ? "pop-check" : ""
        } ${
          item.done
            ? "border-[var(--compass)] bg-[var(--compass)] text-[var(--compass-soft)]"
            : "border-[var(--border-strong)] text-transparent"
        }`}
      >
        ✓
        {celebrate && (
          <span
            aria-hidden
            className="pop-burst pointer-events-none absolute inset-0 rounded-full border-2 border-[var(--compass)]"
          />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`break-words text-sm ${item.done ? "text-[var(--muted)] line-through" : "text-[var(--foreground)]"}`}>
          {item.text}
        </p>
        <span className="mt-0.5 inline-block rounded-full bg-[var(--surface-2)] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-[var(--muted)]">
          {TASK_LIST_LABELS[item.list]}
        </span>
      </div>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Sil"
        className="shrink-0 text-[var(--muted)] hover:text-[var(--route)]"
      >
        ✕
      </button>
    </li>
  );
}

function SortableItemRow(props: ItemRowBaseProps) {
  const { setNodeRef, transform, transition, attributes, listeners, isDragging } = useSortable({
    id: props.item.id,
  });
  return (
    <ItemRow
      {...props}
      sortable={{
        setNodeRef,
        style: { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined },
        attributes,
        listeners,
        isDragging,
      }}
    />
  );
}

function DayItemList({
  items,
  onToggle,
  onDelete,
  onReorderBulk,
}: {
  items: TaskItemDTO[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onReorderBulk: (orderedIds: string[]) => void;
}) {
  const [showDone, setShowDone] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 8 } }));
  if (items.length === 0) return null;

  const activeItems = items.filter((item) => !item.done);
  const doneItems = items.filter((item) => item.done);

  function rowProps(item: TaskItemDTO) {
    return {
      item,
      onToggle: () => onToggle(item.id),
      onDelete: () => onDelete(item.id),
    };
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = activeItems.findIndex((i) => i.id === active.id);
    const newIndex = activeItems.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorderBulk(arrayMove(activeItems, oldIndex, newIndex).map((i) => i.id));
  }

  return (
    <div className="mt-1.5">
      {activeItems.length > 0 && (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={activeItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul>
              {activeItems.map((item) => (
                <SortableItemRow key={item.id} {...rowProps(item)} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      {doneItems.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className="flex items-center gap-1 py-1 text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <span aria-hidden className={`text-[9px] transition-transform ${showDone ? "rotate-90" : ""}`}>
              ▸
            </span>
            Tamamlananlar ({doneItems.length})
          </button>
          {showDone && (
            <ul>
              {doneItems.map((item) => (
                <ItemRow key={item.id} {...rowProps(item)} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function AddRow({ onAdd }: { onAdd: (list: TaskListKey, text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [list, setList] = useState<TaskListKey>("task");
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--compass)]"
      >
        <span aria-hidden>+</span> Görev ekle
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) {
          setOpen(false);
          return;
        }
        onAdd(list, text.trim());
        setText("");
        setOpen(false);
      }}
      className="mt-1 space-y-1.5"
    >
      <div className="flex gap-1.5">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => {
            if (!text.trim() && !e.relatedTarget) setOpen(false);
          }}
          placeholder="Görev adı…"
          className="min-w-0 flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-2.5 py-1.5 text-sm text-[var(--foreground)] focus:border-[var(--compass)] focus:outline-none focus:ring-2 focus:ring-[var(--compass)]/25"
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--foreground)] px-3 py-1.5 text-xs font-medium text-[var(--invert)]"
        >
          Ekle
        </button>
      </div>
      <div className="flex gap-1">
        {ADDABLE_LISTS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setList(l)}
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              list === l ? "bg-[var(--compass)] text-[var(--compass-soft)]" : "bg-[var(--surface-2)] text-[var(--muted)]"
            }`}
          >
            {TASK_LIST_LABELS[l]}
          </button>
        ))}
      </div>
    </form>
  );
}

export function CalendarView({ initialItems }: { initialItems: TaskItemDTO[] }) {
  const [items, setItems] = useState<TaskItemDTO[]>(initialItems);
  const [windowStart, setWindowStart] = useState(() => toISODate(new Date()));
  const todayISO = useMemo(() => toISODate(new Date()), []);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const windowDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDaysISO(windowStart, i)),
    [windowStart]
  );

  function itemsForDate(iso: string) {
    return items.filter((i) => i.date === iso).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  function scrollToDate(iso: string) {
    sectionRefs.current[iso]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleAdd(date: string, list: TaskListKey, text: string) {
    const created = await addTaskItem(list, text, date);
    setItems((prev) => [...prev, created]);
  }

  async function handleToggle(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
    await toggleTaskItem(id).catch(() => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
    });
  }

  async function handleDelete(id: string) {
    const prevItems = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteTaskItem(id).catch(() => setItems(prevItems));
  }

  async function handleReorderBulk(orderedIds: string[]) {
    const prevItems = items;
    const subset = items.filter((i) => orderedIds.includes(i.id));
    const sortOrders = subset.map((i) => i.sortOrder).sort((a, b) => a - b);
    setItems((prev) =>
      prev.map((i) => {
        const idx = orderedIds.indexOf(i.id);
        return idx === -1 ? i : { ...i, sortOrder: sortOrders[idx] };
      })
    );
    await reorderTaskItemsBulk(orderedIds).catch(() => setItems(prevItems));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-4">
      <h1 className="font-display text-lg text-[var(--foreground)]">Calendar</h1>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Görevler&apos;de tarih atadığın her öğe (Task/Buylist) burada da görünür.
      </p>

      {/* Gün şeridi */}
      <div className="mt-4 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setWindowStart((s) => addDaysISO(s, -7))}
          aria-label="Önceki hafta"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-2)]"
        >
          ‹
        </button>
        <div className="grid flex-1 grid-cols-7 gap-1">
          {windowDays.map((iso, i) => {
            const d = fromISODate(iso);
            const isToday = iso === todayISO;
            const hasItems = itemsForDate(iso).length > 0;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => scrollToDate(iso)}
                className="flex flex-col items-center gap-1 rounded-lg py-1.5 hover:bg-[var(--surface-2)]"
              >
                <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
                  {DAY_LABELS[weekdayIndex(d)]}
                </span>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums ${
                    isToday ? "bg-[var(--route)] text-white" : "text-[var(--foreground)]"
                  }`}
                >
                  {d.getDate()}
                </span>
                <span
                  aria-hidden
                  className={`h-1 w-1 rounded-full ${hasItems ? "bg-[var(--compass)]" : "bg-transparent"}`}
                />
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setWindowStart((s) => addDaysISO(s, 7))}
          aria-label="Sonraki hafta"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-2)]"
        >
          ›
        </button>
      </div>
      <button
        type="button"
        onClick={() => setWindowStart(todayISO)}
        className="mt-1.5 text-[11px] font-medium text-[var(--compass)] hover:underline"
      >
        Bugüne dön
      </button>

      {/* Tarihe göre gruplanmış gündem (Task + Buylist + tarihli Inbox öğeleri) */}
      <div className="mt-6 space-y-6">
        {windowDays.map((iso) => {
          const dayItems = itemsForDate(iso);
          return (
            <div key={iso} ref={(el) => { sectionRefs.current[iso] = el; }}>
              <h2 className={`font-display text-sm ${iso === todayISO ? "text-[var(--route)]" : "text-[var(--foreground)]"}`}>
                {dateHeading(iso, todayISO)}
              </h2>
              <DayItemList
                items={dayItems}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onReorderBulk={handleReorderBulk}
              />
              <AddRow onAdd={(list, text) => handleAdd(iso, list, text)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
