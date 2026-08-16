export type Category = "companion" | "multi" | "active" | "passive";
export type ExternalStatus = "inbox" | "not_now" | "on_agenda" | "closed";

export const CATEGORY_ORDER: Category[] = ["companion", "multi", "active", "passive"];

export const CATEGORY_LABELS: Record<Category, string> = {
  companion: "Eşlikçi",
  multi: "Multi",
  active: "Aktif",
  passive: "Pasif",
};

export const STATUS_LABELS: Record<ExternalStatus, string> = {
  inbox: "Gelen Kutusu",
  not_now: "Şimdi Değil",
  on_agenda: "Gündemde",
  closed: "Kapatıldı",
};

export interface WeekNodeDTO {
  id: string;
  nodeId: string;
  title: string;
  category: Category;
  includedOn: string;
  removedOn: string | null;
  sortOrder: number;
  marks: Record<string, boolean>;
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
