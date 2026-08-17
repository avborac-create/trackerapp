"use server";

import { prisma } from "@/app/lib/prisma";
import type { TaskItemDTO, TaskListKey, TaskSectionDTO } from "@/app/lib/types";
import type { TaskList } from "@prisma/client";

function toTaskItemDTO(item: {
  id: string;
  list: string;
  text: string;
  date: string | null;
  done: boolean;
  sortOrder: number;
  sectionId: string | null;
  createdAt: Date;
}): TaskItemDTO {
  return {
    id: item.id,
    list: item.list as TaskListKey,
    text: item.text,
    date: item.date,
    done: item.done,
    sortOrder: item.sortOrder,
    sectionId: item.sectionId,
    createdAt: item.createdAt.toISOString(),
  };
}

function toTaskSectionDTO(section: { id: string; list: string; name: string; sortOrder: number }): TaskSectionDTO {
  return {
    id: section.id,
    list: section.list as TaskListKey,
    name: section.name,
    sortOrder: section.sortOrder,
  };
}

export async function getTaskItems(): Promise<TaskItemDTO[]> {
  const items = await prisma.taskItem.findMany({
    orderBy: [{ list: "asc" }, { sortOrder: "asc" }],
  });
  return items.map(toTaskItemDTO);
}

export async function getTaskSections(): Promise<TaskSectionDTO[]> {
  const sections = await prisma.taskSection.findMany({
    orderBy: [{ list: "asc" }, { sortOrder: "asc" }],
  });
  return sections.map(toTaskSectionDTO);
}

export async function addTaskItem(
  list: TaskListKey,
  text: string,
  date?: string | null,
  sectionId?: string | null
): Promise<TaskItemDTO> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Metin boş olamaz.");
  const count = await prisma.taskItem.count({ where: { list: list as TaskList } });
  const item = await prisma.taskItem.create({
    data: {
      list: list as TaskList,
      text: trimmed,
      date: date ?? null,
      sectionId: sectionId ?? null,
      sortOrder: count,
    },
  });
  return toTaskItemDTO(item);
}

export async function toggleTaskItem(id: string): Promise<TaskItemDTO> {
  const existing = await prisma.taskItem.findUniqueOrThrow({ where: { id } });
  const item = await prisma.taskItem.update({
    where: { id },
    data: { done: !existing.done },
  });
  return toTaskItemDTO(item);
}

export async function deleteTaskItem(id: string): Promise<void> {
  await prisma.taskItem.delete({ where: { id } });
}

export async function moveTaskItem(id: string, list: TaskListKey): Promise<TaskItemDTO> {
  const count = await prisma.taskItem.count({ where: { list: list as TaskList } });
  const item = await prisma.taskItem.update({
    where: { id },
    data: { list: list as TaskList, sortOrder: count, sectionId: null },
  });
  return toTaskItemDTO(item);
}

export async function updateTaskItemDate(id: string, date: string | null): Promise<TaskItemDTO> {
  const item = await prisma.taskItem.update({ where: { id }, data: { date } });
  return toTaskItemDTO(item);
}

export async function setTaskItemSection(id: string, sectionId: string | null): Promise<TaskItemDTO> {
  const item = await prisma.taskItem.update({ where: { id }, data: { sectionId } });
  return toTaskItemDTO(item);
}

export async function addTaskSection(list: TaskListKey, name: string): Promise<TaskSectionDTO> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Kısım adı boş olamaz.");
  const count = await prisma.taskSection.count({ where: { list: list as TaskList } });
  const section = await prisma.taskSection.create({
    data: { list: list as TaskList, name: trimmed, sortOrder: count },
  });
  return toTaskSectionDTO(section);
}

export async function deleteTaskSection(id: string): Promise<void> {
  // TaskItem.sectionId onDelete: SetNull olduğu için, kısımdaki öğeler
  // silinmez, sadece kısımsız (bölümsüz) hale gelir.
  await prisma.taskSection.delete({ where: { id } });
}

/**
 * Bir üstteki/alttaki komşuyla sortOrder'ı takas eder.
 * scope "list": Görevler panosunda aynı liste içinde (tarihten bağımsız).
 * scope "date": Calendar'da aynı gün içinde (listeden bağımsız — karışık listelerden
 * gelen öğeler aynı gün grubunda birlikte sıralanabilsin diye).
 */
export async function reorderTaskItem(
  id: string,
  direction: "up" | "down",
  scope: "list" | "date"
): Promise<void> {
  const current = await prisma.taskItem.findUniqueOrThrow({ where: { id } });
  const neighbor = await prisma.taskItem.findFirst({
    where: {
      ...(scope === "list" ? { list: current.list } : { date: current.date }),
      sortOrder: direction === "up" ? { lt: current.sortOrder } : { gt: current.sortOrder },
    },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return;

  await prisma.$transaction([
    prisma.taskItem.update({ where: { id: current.id }, data: { sortOrder: neighbor.sortOrder } }),
    prisma.taskItem.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder } }),
  ]);
}

/**
 * Sürükle-bırak ile yeniden sıralama: verilen id listesinin (aynı görsel grup
 * içindeki öğeler — bir bölüm ya da bir Calendar günü) mevcut sortOrder
 * değerlerini korur, sadece bu küme içindeki dağılımını yeni sıraya göre
 * yeniden atar. Böylece kümenin dışındaki öğelerle çakışma olmaz.
 */
export async function reorderTaskItemsBulk(orderedIds: string[]): Promise<void> {
  if (orderedIds.length < 2) return;
  const items = await prisma.taskItem.findMany({ where: { id: { in: orderedIds } } });
  const sortOrders = items.map((i) => i.sortOrder).sort((a, b) => a - b);
  await prisma.$transaction(
    orderedIds.map((id, i) => prisma.taskItem.update({ where: { id }, data: { sortOrder: sortOrders[i] } }))
  );
}
