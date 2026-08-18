"use server";

import { prisma } from "@/app/lib/prisma";
import { isoToUTCDate, utcDateToISO } from "@/app/lib/dates";
import { toNodeDTO, toWeekDTO } from "@/app/lib/serialize";
import type { Category, ExternalStatus } from "@prisma/client";
import type { DailyMarkStatus, DashboardStats, NodeDTO, WeekDTO, WeekHistoryEntryDTO } from "@/app/lib/types";
import { computeWeekStats } from "@/app/lib/stats";

const WEEK_INCLUDE = {
  weekNodes: {
    where: { removedOn: null },
    orderBy: { sortOrder: "asc" as const },
    include: {
      node: true,
      dailyMarks: { include: { entries: { orderBy: { createdAt: "asc" as const } } } },
    },
  },
};

/**
 * İstemcinin yerel "bugün"üne göre mevcut haftayı getirir; yoksa oluşturur.
 * Açık bir hafta varsa ama başlangıcı istenenden eskiyse (yeni takvim
 * haftasına geçilmiş demektir) eski haftayı kapatıp yenisini açar ve
 * Gündemde eylemleri yeni haftaya taşır.
 */
export async function getOrCreateCurrentWeek(
  weekStartISO: string,
  weekEndISO: string
): Promise<WeekDTO> {
  const existing = await prisma.week.findFirst({
    where: { startsOn: isoToUTCDate(weekStartISO) },
    include: WEEK_INCLUDE,
  });
  if (existing) return toWeekDTO(existing);

  const openWeek = await prisma.week.findFirst({ where: { state: "open" } });
  if (openWeek && openWeek.startsOn < isoToUTCDate(weekStartISO)) {
    await prisma.week.update({
      where: { id: openWeek.id },
      data: { state: "closed", closedAt: new Date() },
    });
  }

  const week = await createWeekWithAgendaNodes(weekStartISO, weekEndISO);
  return toWeekDTO(week);
}

async function createWeekWithAgendaNodes(weekStartISO: string, weekEndISO: string) {
  const agendaNodes = await prisma.node.findMany({
    where: { externalStatus: "on_agenda" },
    orderBy: { createdAt: "asc" },
  });

  return prisma.week.create({
    data: {
      startsOn: isoToUTCDate(weekStartISO),
      endsOn: isoToUTCDate(weekEndISO),
      state: "open",
      weekNodes: {
        create: agendaNodes.map((node: (typeof agendaNodes)[number], i: number) => ({
          nodeId: node.id,
          categorySnapshot: node.category,
          includedOn: isoToUTCDate(weekStartISO),
          sortOrder: i,
        })),
      },
    },
    include: WEEK_INCLUDE,
  });
}

export async function closeCurrentWeekAndAdvance(
  currentWeekId: string,
  nextWeekStartISO: string,
  nextWeekEndISO: string
): Promise<WeekDTO> {
  await prisma.week.update({
    where: { id: currentWeekId },
    data: { state: "closed", closedAt: new Date() },
  });
  const week = await createWeekWithAgendaNodes(nextWeekStartISO, nextWeekEndISO);
  return toWeekDTO(week);
}

export async function getAdjacentWeek(
  currentStartISO: string,
  direction: "prev" | "next"
): Promise<WeekDTO | null> {
  const week =
    direction === "prev"
      ? await prisma.week.findFirst({
          where: { startsOn: { lt: isoToUTCDate(currentStartISO) } },
          orderBy: { startsOn: "desc" },
          include: WEEK_INCLUDE,
        })
      : await prisma.week.findFirst({
          where: { startsOn: { gt: isoToUTCDate(currentStartISO) } },
          orderBy: { startsOn: "asc" },
          include: WEEK_INCLUDE,
        });
  return week ? toWeekDTO(week) : null;
}

export async function getWeekHistory(): Promise<WeekHistoryEntryDTO[]> {
  const weeks = await prisma.week.findMany({
    orderBy: { startsOn: "desc" },
    include: WEEK_INCLUDE,
  });
  return weeks.map((w: (typeof weeks)[number]) => {
    const dto = toWeekDTO(w);
    const stats = computeWeekStats(dto);
    return {
      id: w.id,
      startsOn: dto.startsOn,
      endsOn: dto.endsOn,
      state: dto.state,
      totalCompleted: stats.totalCompleted,
      totalPossible: stats.totalPossible,
    };
  });
}

/**
 * Eylem bazlı aylık tamamlanma tablosu (tüm haftalar üzerinden pivot görünüm).
 * Google Sheets V2 PRD'sindeki "Dashboard" sekmesinin karşılığı.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const weeks = await prisma.week.findMany({
    orderBy: { startsOn: "asc" },
    include: WEEK_INCLUDE,
  });

  const rowsByNode = new Map<string, DashboardStats["rows"][number]>();
  const months = new Set<string>();

  for (const w of weeks as (typeof weeks)[number][]) {
    const dto = toWeekDTO(w);
    const stats = computeWeekStats(dto);
    const month = dto.startsOn.slice(0, 7);
    months.add(month);

    for (const wn of dto.weekNodes) {
      const stat = stats.nodeStats[wn.id];
      if (!stat || stat.possible === 0) continue;

      let row = rowsByNode.get(wn.nodeId);
      if (!row) {
        row = { nodeId: wn.nodeId, title: wn.title, cells: {}, totalCompleted: 0, totalPossible: 0 };
        rowsByNode.set(wn.nodeId, row);
      }
      row.title = wn.title;

      const existingCell = row.cells[month] ?? { completed: 0, possible: 0, percent: 0 };
      existingCell.completed += stat.completed;
      existingCell.possible += stat.possible;
      existingCell.percent = Math.round((existingCell.completed / existingCell.possible) * 100);
      row.cells[month] = existingCell;

      row.totalCompleted += stat.completed;
      row.totalPossible += stat.possible;
    }
  }

  const sortedMonths = Array.from(months).sort();
  const rows = Array.from(rowsByNode.values()).sort((a, b) => a.title.localeCompare(b.title, "tr"));

  return { months: sortedMonths, rows };
}

export async function getWeekByIdAction(weekId: string): Promise<WeekDTO | null> {
  const week = await prisma.week.findUnique({ where: { id: weekId }, include: WEEK_INCLUDE });
  return week ? toWeekDTO(week) : null;
}

export async function getInboxNodes(): Promise<NodeDTO[]> {
  const nodes = await prisma.node.findMany({
    where: { externalStatus: { in: ["inbox", "not_now", "closed"] } },
    orderBy: { createdAt: "desc" },
  });
  return nodes.map(toNodeDTO);
}

export async function addNode(title: string): Promise<NodeDTO> {
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Ad boş olamaz.");
  const node = await prisma.node.create({
    data: { title: trimmed, externalStatus: "inbox", category: "active" },
  });
  return toNodeDTO(node);
}

export async function updateNode(
  nodeId: string,
  data: {
    title?: string;
    category?: Category;
    externalStatus?: ExternalStatus;
    notes?: string | null;
    tags?: string[];
  }
): Promise<NodeDTO> {
  const patch: Record<string, unknown> = {};
  if (data.title !== undefined) {
    const trimmed = data.title.trim();
    if (!trimmed) throw new Error("Ad boş olamaz.");
    patch.title = trimmed;
  }
  if (data.category !== undefined) patch.category = data.category;
  if (data.externalStatus !== undefined) patch.externalStatus = data.externalStatus;
  if (data.notes !== undefined) {
    const trimmedNotes = data.notes?.trim();
    patch.notes = trimmedNotes ? trimmedNotes : null;
  }
  if (data.tags !== undefined) {
    patch.tags = data.tags.map((t) => t.trim()).filter(Boolean);
  }

  const node = await prisma.node.update({ where: { id: nodeId }, data: patch });

  // Açık haftadaki mevcut karta yansıt (geçmiş haftalar değişmez).
  if (data.category !== undefined) {
    const openWeek = await prisma.week.findFirst({ where: { state: "open" } });
    if (openWeek) {
      await prisma.weekNode.updateMany({
        where: { weekId: openWeek.id, nodeId, removedOn: null },
        data: { categorySnapshot: data.category },
      });
    }
  }

  return toNodeDTO(node);
}

/** Sürükle-bırak ile bir kategori içindeki eylem kartlarını yeniden sıralar —
 * verilen weekNode id listesinin mevcut sortOrder değerlerini korur, sadece
 * bu küme içindeki dağılımını yeni sıraya göre yeniden atar. */
export async function reorderWeekNodesBulk(orderedWeekNodeIds: string[]): Promise<void> {
  if (orderedWeekNodeIds.length < 2) return;
  const nodes = await prisma.weekNode.findMany({ where: { id: { in: orderedWeekNodeIds } } });
  const sortOrders = nodes.map((n) => n.sortOrder).sort((a, b) => a - b);
  await prisma.$transaction(
    orderedWeekNodeIds.map((id, i) => prisma.weekNode.update({ where: { id }, data: { sortOrder: sortOrders[i] } }))
  );
}

/** PRD akış B: eylemi Gündemde'ye alıp mevcut haftaya dahil eder. */
export async function moveNodeToAgenda(
  nodeId: string,
  category: Category,
  todayISO: string,
  weekStartISO: string,
  weekEndISO: string
): Promise<WeekDTO> {
  await prisma.node.update({
    where: { id: nodeId },
    data: { externalStatus: "on_agenda", category },
  });

  await getOrCreateCurrentWeek(weekStartISO, weekEndISO);
  const week = await prisma.week.findFirstOrThrow({
    where: { startsOn: isoToUTCDate(weekStartISO) },
  });

  const already = await prisma.weekNode.findFirst({
    where: { weekId: week.id, nodeId, removedOn: null },
  });
  if (!already) {
    // [weekId, nodeId] tekil olduğu için, bu hafta içinde daha önce çıkarılmış
    // (removedOn dolu) bir kayıt varsa yeni satır oluşturmak yerine onu yeniden
    // etkinleştiriyoruz.
    const removedEarlier = await prisma.weekNode.findUnique({
      where: { weekId_nodeId: { weekId: week.id, nodeId } },
    });
    const count = await prisma.weekNode.count({ where: { weekId: week.id } });
    if (removedEarlier) {
      await prisma.weekNode.update({
        where: { id: removedEarlier.id },
        data: {
          categorySnapshot: category,
          includedOn: isoToUTCDate(todayISO),
          removedOn: null,
          sortOrder: count,
        },
      });
    } else {
      await prisma.weekNode.create({
        data: {
          weekId: week.id,
          nodeId,
          categorySnapshot: category,
          includedOn: isoToUTCDate(todayISO),
          sortOrder: count,
        },
      });
    }
  }

  const full = await prisma.week.findUniqueOrThrow({
    where: { id: week.id },
    include: WEEK_INCLUDE,
  });
  return toWeekDTO(full);
}

/** Eylemi mevcut açık haftadan çıkarır (dış durum değişince kullanılır). */
async function removeNodeFromOpenWeek(nodeId: string, todayISO: string) {
  const openWeek = await prisma.week.findFirst({ where: { state: "open" } });
  if (!openWeek) return;
  await prisma.weekNode.updateMany({
    where: { weekId: openWeek.id, nodeId, removedOn: null },
    data: { removedOn: isoToUTCDate(todayISO) },
  });
}

export async function setNodeExternalStatus(
  nodeId: string,
  status: ExternalStatus,
  todayISO: string
): Promise<NodeDTO> {
  const node = await prisma.node.update({
    where: { id: nodeId },
    data: { externalStatus: status },
  });
  if (status !== "on_agenda") {
    await removeNodeFromOpenWeek(nodeId, todayISO);
  }
  return toNodeDTO(node);
}

/** Hızlı işaretleme: boş ↔ yapıldı arasında geçiş yapar (önceki durum
 * "beklenmedik"/"ihmal" olsa bile tek tıkla "yapıldı"ya geçer). Belirli bir
 * durum atamak için setDailyMarkStatus kullanılır. */
export async function toggleDailyMark(
  weekNodeId: string,
  dayISO: string
): Promise<{ day: string; status: DailyMarkStatus | null }> {
  const day = isoToUTCDate(dayISO);
  const existing = await prisma.dailyMark.findUnique({
    where: { weekNodeId_day: { weekNodeId, day } },
  });

  const nextStatus: DailyMarkStatus | null = existing?.status === "done" ? null : "done";

  const mark = existing
    ? await prisma.dailyMark.update({
        where: { id: existing.id },
        data: { status: nextStatus },
      })
    : await prisma.dailyMark.create({
        data: { weekNodeId, day, status: nextStatus },
      });

  return { day: utcDateToISO(mark.day), status: mark.status };
}

/** Belirli bir günü açıkça "yapıldı" / "beklenmedik engel" / "ihmal" / boş
 * olarak işaretler (status=null → boş). */
export async function setDailyMarkStatus(
  weekNodeId: string,
  dayISO: string,
  status: DailyMarkStatus | null
): Promise<{ day: string; status: DailyMarkStatus | null }> {
  const day = isoToUTCDate(dayISO);
  const mark = await prisma.dailyMark.upsert({
    where: { weekNodeId_day: { weekNodeId, day } },
    update: { status },
    create: { weekNodeId, day, status },
  });
  return { day: utcDateToISO(mark.day), status: mark.status };
}

/**
 * O gün için ayrı bir uygulama kaydı ekler (aynı gün birden çok kez uygulanmış
 * olabilir, her biri kendi kaydıyla sayılır). Kayıt eklenince gün otomatik
 * tamamlandı sayılır.
 */
export async function addDailyMarkEntry(
  weekNodeId: string,
  dayISO: string,
  text: string
): Promise<{ day: string; status: DailyMarkStatus | null; entry: { id: string; text: string } }> {
  const trimmed = text.trim();
  const day = isoToUTCDate(dayISO);

  const mark = await prisma.dailyMark.upsert({
    where: { weekNodeId_day: { weekNodeId, day } },
    update: { status: "done" },
    create: { weekNodeId, day, status: "done" },
  });

  const entry = await prisma.dailyMarkEntry.create({
    data: { dailyMarkId: mark.id, text: trimmed },
  });

  return {
    day: utcDateToISO(mark.day),
    status: mark.status,
    entry: { id: entry.id, text: entry.text },
  };
}

export async function deleteDailyMarkEntry(
  weekNodeId: string,
  dayISO: string,
  entryId: string
): Promise<{ day: string }> {
  const day = isoToUTCDate(dayISO);
  const mark = await prisma.dailyMark.findUnique({ where: { weekNodeId_day: { weekNodeId, day } } });
  if (mark) {
    await prisma.dailyMarkEntry.deleteMany({ where: { id: entryId, dailyMarkId: mark.id } });
  }
  return { day: dayISO };
}
