"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { playCompletionChime } from "@/app/lib/sound";
import {
  addTaskItem,
  addTaskSection,
  deleteTaskItem,
  deleteTaskSection,
  moveTaskItem,
  reorderTaskItemsBulk,
  setTaskItemSection,
  toggleTaskItem,
  updateTaskItemDate,
} from "@/app/lib/taskActions";
import { fromISODate, MONTHS_TR } from "@/app/lib/dates";
import {
  TASK_BOARD_LISTS,
  TASK_LIST_LABELS,
  type TaskItemDTO,
  type TaskListKey,
  type TaskSectionDTO,
} from "@/app/lib/types";

const MOVE_TARGETS: Partial<Record<TaskListKey, TaskListKey[]>> = {
  inbox: ["task", "buylist"],
};

function formatShortDate(iso: string): string {
  const d = fromISODate(iso);
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()]}`;
}

function ListIcon({ list, className }: { list: TaskListKey; className?: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", className };
  switch (list) {
    case "inbox":
      return (
        <svg {...common}>
          <path
            d="M4 4h16v6.5l-2.2 7a2 2 0 0 1-1.9 1.5H8.1a2 2 0 0 1-1.9-1.5L4 10.5V4Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M4 10h4.5l1 2h5l1-2H20" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "task":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8.5 12.5l2.3 2.3L16 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "buylist":
      return (
        <svg {...common}>
          <path d="M6 8h12l-1 12H7L6 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4 9.5h16M8 3v3M16 3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
}

function DateControl({ date, onSet, onClear }: { date: string | null; onSet: (iso: string) => void; onClear: () => void }) {
  const [open, setOpen] = useState(false);

  if (date) {
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)]">
        {formatShortDate(date)}
        <button type="button" onClick={onClear} aria-label="Tarihi kaldır" className="hover:text-[var(--route)]">
          ✕
        </button>
      </span>
    );
  }

  if (open) {
    // iOS, odaklanılan form kontrolünün font-size'ı 16px'in altındaysa sayfayı
    // otomatik yakınlaştırır — bu yüzden gerçek font-size'ı 16px tutup görsel
    // boyutu transform: scale() ile küçültüyoruz (bkz. "Bölümsüz" seçici).
    return (
      <span className="relative -my-1.5 inline-block h-[19px] w-[92px] shrink-0 overflow-hidden align-middle">
        <input
          type="date"
          autoFocus
          onChange={(e) => {
            if (e.target.value) onSet(e.target.value);
            setOpen(false);
          }}
          onBlur={() => setOpen(false)}
          className="absolute left-0 top-0 origin-top-left scale-[0.7] rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] px-1.5 py-0.5 text-[var(--foreground)]"
        />
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium text-[var(--muted)] opacity-0 group-hover:opacity-100 hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
    >
      + tarih
    </button>
  );
}

type TaskRowSortable = {
  setNodeRef: (el: HTMLElement | null) => void;
  style: React.CSSProperties;
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
  isDragging: boolean;
};

type TaskRowBaseProps = {
  item: TaskItemDTO;
  sections: TaskSectionDTO[];
  onToggle: () => void;
  onDelete: () => void;
  onMove: (target: TaskListKey) => void;
  onSetDate: (iso: string | null) => void;
  onSetSection: (sectionId: string | null) => void;
};

function TaskRow({
  item,
  sections,
  onToggle,
  onDelete,
  onMove,
  onSetDate,
  onSetSection,
  sortable,
}: TaskRowBaseProps & { sortable?: TaskRowSortable }) {
  const moveTargets = MOVE_TARGETS[item.list] ?? [];
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
      className={`group flex items-start gap-2 border-b border-[var(--border-subtle)] py-2.5 last:border-0 ${
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
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <DateControl date={item.date} onSet={onSetDate} onClear={() => onSetDate(null)} />
          {sections.length > 0 && (
            // iOS, odaklanılan form kontrolünün font-size'ı 16px'in altındaysa sayfayı
            // otomatik yakınlaştırır — bu yüzden gerçek font-size'ı 16px tutup görsel
            // boyutu transform: scale() ile küçültüyoruz (zoom tetiklenmez).
            <span className="relative -my-1.5 -ml-0.5 inline-block h-[19px] w-[78px] shrink-0 overflow-hidden align-middle">
              <select
                value={item.sectionId ?? ""}
                onChange={(e) => onSetSection(e.target.value || null)}
                aria-label="Kısım"
                className="absolute left-0 top-0 origin-top-left scale-[0.7] appearance-none whitespace-nowrap rounded-full border-none bg-[var(--surface-2)] py-0.5 pl-2 pr-4 font-medium leading-none text-[var(--muted)] hover:text-[var(--foreground)] focus:outline-none"
              >
                <option value="">Bölümsüz</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <span aria-hidden className="pointer-events-none absolute right-1 top-1 text-[8px] text-[var(--muted)]">
                ▾
              </span>
            </span>
          )}
          {moveTargets.map((target) => (
            <button
              key={target}
              type="button"
              onClick={() => onMove(target)}
              className="shrink-0 rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              → {TASK_LIST_LABELS[target]}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onDelete}
        aria-label="Sil"
        className="shrink-0 text-[var(--muted)] opacity-0 hover:text-[var(--route)] group-hover:opacity-100"
      >
        ✕
      </button>
    </li>
  );
}

function SortableTaskRow(props: TaskRowBaseProps) {
  const { setNodeRef, transform, transition, attributes, listeners, isDragging } = useSortable({
    id: props.item.id,
  });
  return (
    <TaskRow
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

function AddItemForm({
  onAdd,
  placeholder = "Yeni öğe, Enter'a bas…",
  autoFocus = false,
  onDone,
}: {
  onAdd: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onDone?: () => void;
}) {
  const [text, setText] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onAdd(text.trim());
        setText("");
      }}
      className="flex gap-1.5"
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onDone?.();
        }}
        onBlur={() => {
          if (!text.trim()) onDone?.();
        }}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--compass)] focus:outline-none focus:ring-2 focus:ring-[var(--compass)]/25"
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="shrink-0 rounded-lg bg-[var(--foreground)] px-3 py-2 text-xs font-medium text-[var(--invert)] disabled:opacity-40"
      >
        Ekle
      </button>
    </form>
  );
}

function ItemGroup({
  items,
  sections,
  onToggle,
  onDelete,
  onMove,
  onReorderBulk,
  onSetDate,
  onSetSection,
}: {
  items: TaskItemDTO[];
  sections: TaskSectionDTO[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, target: TaskListKey) => void;
  onReorderBulk: (orderedIds: string[]) => void;
  onSetDate: (id: string, iso: string | null) => void;
  onSetSection: (id: string, sectionId: string | null) => void;
}) {
  const [showDone, setShowDone] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 8 } }));
  if (items.length === 0) return null;

  const activeItems = items.filter((item) => !item.done);
  const doneItems = items.filter((item) => item.done);

  function rowProps(item: TaskItemDTO) {
    return {
      item,
      sections,
      onToggle: () => onToggle(item.id),
      onDelete: () => onDelete(item.id),
      onMove: (target: TaskListKey) => onMove(item.id, target),
      onSetDate: (iso: string | null) => onSetDate(item.id, iso),
      onSetSection: (sectionId: string | null) => onSetSection(item.id, sectionId),
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
    <div className="space-y-2">
      {activeItems.length > 0 && (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={activeItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {activeItems.map((item) => (
                <SortableTaskRow key={item.id} {...rowProps(item)} />
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
            <ul className="space-y-2 pt-1">
              {doneItems.map((item) => (
                <TaskRow key={item.id} {...rowProps(item)} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function TaskColumn({
  list,
  items,
  sections,
  onAdd,
  onToggle,
  onDelete,
  onMove,
  onReorderBulk,
  onSetDate,
  onSetSection,
  onAddSection,
  onDeleteSection,
}: {
  list: TaskListKey;
  items: TaskItemDTO[];
  sections: TaskSectionDTO[];
  onAdd: (text: string, sectionId: string | null) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, target: TaskListKey) => void;
  onReorderBulk: (orderedIds: string[]) => void;
  onSetDate: (id: string, iso: string | null) => void;
  onSetSection: (id: string, sectionId: string | null) => void;
  onAddSection: (name: string) => void;
  onDeleteSection: (id: string) => void;
}) {
  const [addingSection, setAddingSection] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const doneCount = items.filter((i) => i.done).length;
  const unsectioned = items.filter((i) => !i.sectionId);

  function toggleSectionCollapsed(sectionId: string) {
    setCollapsedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  }

  return (
    <div className="relative flex min-w-0 flex-1 flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 backdrop-blur-xl backdrop-saturate-150">
      <h2 className="flex items-center gap-1.5 font-display text-xl font-bold tracking-tight text-[var(--foreground)]">
        <ListIcon list={list} className="text-[var(--muted)]" />
        {TASK_LIST_LABELS[list]}{" "}
        <span className="text-xs font-normal tabular-nums text-[var(--muted)]">
          ({doneCount}/{items.length})
        </span>
      </h2>

      {addingItem ? (
        <div className="mt-3">
          <AddItemForm
            autoFocus
            onAdd={(text) => onAdd(text, null)}
            onDone={() => setAddingItem(false)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingItem(true)}
          className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--compass)]"
        >
          <span aria-hidden>+</span> Yeni öğe
        </button>
      )}

      <div className="mt-3 space-y-4">
        <ItemGroup
          items={unsectioned}
          sections={sections}
          onToggle={onToggle}
          onDelete={onDelete}
          onMove={onMove}
          onReorderBulk={onReorderBulk}
          onSetDate={onSetDate}
          onSetSection={onSetSection}
        />

        {sections.map((section) => {
          const sectionItems = items.filter((i) => i.sectionId === section.id);
          const collapsed = !!collapsedSections[section.id];
          return (
            <div key={section.id}>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggleSectionCollapsed(section.id)}
                  aria-expanded={!collapsed}
                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  <span aria-hidden className={`text-[9px] transition-transform ${collapsed ? "-rotate-90" : ""}`}>
                    ▾
                  </span>
                  {section.name} <span className="tabular-nums">({sectionItems.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`"${section.name}" kısmını silmek istediğine emin misin? İçindeki öğeler bölümsüz olarak kalacak.`)) {
                      onDeleteSection(section.id);
                    }
                  }}
                  aria-label={`${section.name} kısmını sil`}
                  title="Kısmı sil"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--route)]"
                >
                  ⋯
                </button>
              </div>
              {!collapsed && (
                <div className="mt-1.5 space-y-2">
                  <ItemGroup
                    items={sectionItems}
                    sections={sections}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onMove={onMove}
                    onReorderBulk={onReorderBulk}
                    onSetDate={onSetDate}
                    onSetSection={onSetSection}
                  />
                  <AddItemForm onAdd={(text) => onAdd(text, section.id)} placeholder="Bu kısma öğe ekle…" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {items.length === 0 && sections.length === 0 && (
        <p className="mt-3 text-xs text-[var(--muted)] opacity-60">Boş.</p>
      )}

      <div className="mt-4">
        {addingSection ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem("sectionName") as HTMLInputElement;
              if (input.value.trim()) onAddSection(input.value.trim());
              setAddingSection(false);
            }}
            className="flex gap-1.5"
          >
            <input
              name="sectionName"
              autoFocus
              placeholder="Kısım adı…"
              onBlur={(e) => {
                if (!e.target.value.trim()) setAddingSection(false);
              }}
              className="min-w-0 flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--foreground)] focus:border-[var(--compass)] focus:outline-none"
            />
            <button type="submit" className="rounded-lg bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]">
              Ekle
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAddingSection(true)}
            className="text-xs font-medium text-[var(--muted)] hover:text-[var(--compass)]"
          >
            + Kısım ekle
          </button>
        )}
      </div>

      {!addingItem && (
        <button
          type="button"
          onClick={() => setAddingItem(true)}
          aria-label="Yeni öğe ekle"
          className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--route)] text-2xl font-light text-white shadow-lg lg:hidden"
        >
          +
        </button>
      )}
    </div>
  );
}

export function TaskManager({
  initialItems,
  initialSections,
}: {
  initialItems: TaskItemDTO[];
  initialSections: TaskSectionDTO[];
}) {
  const [items, setItems] = useState<TaskItemDTO[]>(initialItems);
  const [sections, setSections] = useState<TaskSectionDTO[]>(initialSections);
  const [activeList, setActiveListState] = useState<TaskListKey>("inbox");

  useEffect(() => {
    const stored = window.localStorage.getItem("tracker_active_list") as TaskListKey | null;
    if (stored && TASK_BOARD_LISTS.includes(stored)) setActiveListState(stored);
  }, []);

  function setActiveList(list: TaskListKey) {
    setActiveListState(list);
    window.localStorage.setItem("tracker_active_list", list);
  }

  function itemsFor(list: TaskListKey) {
    return items.filter((i) => i.list === list).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  function sectionsFor(list: TaskListKey) {
    return sections.filter((s) => s.list === list).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async function handleAdd(list: TaskListKey, text: string, sectionId: string | null) {
    const created = await addTaskItem(list, text, null, sectionId);
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

  async function handleMove(id: string, target: TaskListKey) {
    const prevItems = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    const moved = await moveTaskItem(id, target).catch(() => {
      setItems(prevItems);
      return null;
    });
    if (moved) setItems((prev) => [...prev, moved]);
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

  async function handleSetDate(id: string, iso: string | null) {
    const prevItems = items;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, date: iso } : i)));
    await updateTaskItemDate(id, iso).catch(() => setItems(prevItems));
  }

  async function handleSetSection(id: string, sectionId: string | null) {
    const prevItems = items;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, sectionId } : i)));
    await setTaskItemSection(id, sectionId).catch(() => setItems(prevItems));
  }

  async function handleAddSection(list: TaskListKey, name: string) {
    const created = await addTaskSection(list, name);
    setSections((prev) => [...prev, created]);
  }

  async function handleDeleteSection(id: string) {
    const prevSections = sections;
    const prevItems = items;
    setSections((prev) => prev.filter((s) => s.id !== id));
    setItems((prev) => prev.map((i) => (i.sectionId === id ? { ...i, sectionId: null } : i)));
    await deleteTaskSection(id).catch(() => {
      setSections(prevSections);
      setItems(prevItems);
    });
  }

  function renderColumn(list: TaskListKey) {
    return (
      <TaskColumn
        list={list}
        items={itemsFor(list)}
        sections={sectionsFor(list)}
        onAdd={(text, sectionId) => handleAdd(list, text, sectionId)}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onMove={handleMove}
        onReorderBulk={handleReorderBulk}
        onSetDate={handleSetDate}
        onSetSection={handleSetSection}
        onAddSection={(name) => handleAddSection(list, name)}
        onDeleteSection={handleDeleteSection}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-4 lg:pb-16">
      <h1 className="font-display text-lg text-[var(--foreground)]">Görevler</h1>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Hızlı yakalama: not al, sırala, taşı — sürtünmesiz. Bir tarih atarsan Calendar&apos;da da görünür.
      </p>

      {/* Masaüstü: tüm listeler yan yana */}
      <div className="mt-4 hidden gap-4 lg:flex">
        {TASK_BOARD_LISTS.map((list) => (
          <div key={list} className="flex min-w-0 flex-1">
            {renderColumn(list)}
          </div>
        ))}
      </div>

      {/* Mobil: tek liste görünür, alt sekme çubuğuyla geçiş yapılır */}
      <div className="mt-4 lg:hidden">{renderColumn(activeList)}</div>

      <nav
        className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-fit gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] p-1 shadow-lg backdrop-blur-xl backdrop-saturate-150 lg:hidden"
        aria-label="Görev listeleri"
      >
        {TASK_BOARD_LISTS.map((list) => {
          const active = list === activeList;
          return (
            <button
              key={list}
              type="button"
              onClick={() => setActiveList(list)}
              className={`flex flex-col items-center gap-0.5 rounded-full px-4 py-1.5 text-[10px] font-medium transition-colors ${
                active
                  ? "bg-[var(--route)] text-white"
                  : "text-[var(--muted)] hover:bg-[var(--surface-2)]"
              }`}
            >
              <ListIcon list={list} />
              {TASK_LIST_LABELS[list]}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
