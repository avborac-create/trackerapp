export type Category = "companion" | "multi" | "active" | "passive";
export type ExternalStatus = "inbox" | "not_now" | "on_agenda" | "closed";

export const CATEGORY_ORDER: Category[] = ["companion", "multi", "passive", "active"];

export const CATEGORY_LABELS: Record<Category, string> = {
  companion: "Eşlikçi",
  multi: "Multi",
  active: "Aktif",
  passive: "Pasif",
};

export const STATUS_LABELS: Record<ExternalStatus, string> = {
  inbox: "📥 Gelen Kutusu",
  not_now: "⏸️ Durduruldu",
  on_agenda: "📌 Gündemde",
  closed: "✅ Kapatıldı",
};

export type DailyMarkEntryKind = "success" | "failure";

export interface DayEntry {
  id: string;
  text: string;
  kind: DailyMarkEntryKind;
}

/** done: yapıldı. unexpected: beklenmedik engel (yüzdenin paydasından düşülür).
 * neglected: bilinçli ihmal (paydada kalır, aleyhte sayılır). */
export type DailyMarkStatus = "done" | "unexpected" | "neglected";

export const DAILY_MARK_STATUS_LABELS: Record<DailyMarkStatus, string> = {
  done: "Yapıldı",
  unexpected: "Beklenmedik engel",
  neglected: "İhmal",
};

export interface WeekNodeDTO {
  id: string;
  nodeId: string;
  title: string;
  category: Category;
  notes: string | null;
  tags: string[];
  includedOn: string;
  removedOn: string | null;
  sortOrder: number;
  marks: Record<string, DailyMarkStatus>;
  dayEntries: Record<string, DayEntry[]>;
}

export interface WeekDTO {
  id: string;
  startsOn: string;
  endsOn: string;
  state: "open" | "closed";
  weekNodes: WeekNodeDTO[];
}

export interface NodeDTO {
  id: string;
  title: string;
  category: Category;
  externalStatus: ExternalStatus;
  notes: string | null;
  tags: string[];
  createdAt: string;
}

export interface WeekHistoryEntryDTO {
  id: string;
  startsOn: string;
  endsOn: string;
  state: "open" | "closed";
  totalCompleted: number;
  totalPossible: number;
}

export interface DashboardCell {
  completed: number;
  possible: number;
  percent: number;
}

export interface DashboardRow {
  nodeId: string;
  title: string;
  cells: Record<string, DashboardCell>;
  totalCompleted: number;
  totalPossible: number;
}

export interface DashboardStats {
  months: string[];
  rows: DashboardRow[];
}

/** Depolama listesi. "calendar" artık ayrı bir liste değildir (geriye dönük tip uyumu için tutulur) — bir öğeye "date" atanınca Calendar'da kaynak listesiyle birlikte görünür. */
export type TaskListKey = "inbox" | "task" | "buylist" | "calendar";

/** Görevler panosunda yan yana/sekme olarak gösterilen listeler. */
export const TASK_BOARD_LISTS: TaskListKey[] = ["inbox", "task", "buylist"];

export const TASK_LIST_LABELS: Record<TaskListKey, string> = {
  inbox: "Inbox",
  task: "Task",
  buylist: "Buylist",
  calendar: "Calendar",
};

export interface TaskSectionDTO {
  id: string;
  list: TaskListKey;
  name: string;
  sortOrder: number;
}

export interface TaskItemDTO {
  id: string;
  list: TaskListKey;
  text: string;
  date: string | null;
  done: boolean;
  sortOrder: number;
  sectionId: string | null;
  createdAt: string;
}
