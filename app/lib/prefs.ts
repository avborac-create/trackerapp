// localStorage tabanlı Habits görünüm tercihleri — tema/hakim renkten farklı
// olarak DOM'a değil doğrudan bileşen render mantığına etki eder, bu yüzden
// sayfa yeniden yüklendiğinde/gezinildiğinde uygulanır (canlı senkron gerekmez).

export type HabitsViewMode = "table" | "strip";
export const HABITS_VIEW_KEY = "tracker_habits_view";
export const HABITS_VIEW_DEFAULT: HabitsViewMode = "table";

export function getHabitsViewMode(): HabitsViewMode {
  if (typeof window === "undefined") return HABITS_VIEW_DEFAULT;
  const stored = window.localStorage.getItem(HABITS_VIEW_KEY);
  return stored === "table" || stored === "strip" ? stored : HABITS_VIEW_DEFAULT;
}

export type DayBadgeStyle = "number" | "corner";
export const DAY_BADGE_KEY = "tracker_day_badge";
export const DAY_BADGE_DEFAULT: DayBadgeStyle = "corner";

export function getDayBadgeStyle(): DayBadgeStyle {
  if (typeof window === "undefined") return DAY_BADGE_DEFAULT;
  const stored = window.localStorage.getItem(DAY_BADGE_KEY);
  return stored === "number" || stored === "corner" ? stored : DAY_BADGE_DEFAULT;
}

/** Pano (durum kanbanı) kart dokusu: "flat" düz/Canva hissi, "sticky" el
 * yazısı + hafif döndürülmüş fiziksel post-it hissi. Renkler (kategori/durum)
 * her iki modda da aynıdır — bu yalnızca doku/tipografi tercihidir. */
export type BoardStyle = "flat" | "sticky";
export const BOARD_STYLE_KEY = "tracker_board_style";
export const BOARD_STYLE_DEFAULT: BoardStyle = "flat";

export function getBoardStyle(): BoardStyle {
  if (typeof window === "undefined") return BOARD_STYLE_DEFAULT;
  const stored = window.localStorage.getItem(BOARD_STYLE_KEY);
  return stored === "flat" || stored === "sticky" ? stored : BOARD_STYLE_DEFAULT;
}

/** Pano'daki notların sütun içi serbest konumu (px, sütunun sol-üst köşesine
 * göre) ve sütun kutularının elle ayarlanan boyutu. Cihaza özel bir görünüm
 * tercihidir (Node veritabanı kaydını etkilemez), bu yüzden localStorage'da
 * tutulur — sunucuya taşınmaz, cihazlar arası senkron olmaz. */
export type BoardPosition = { x: number; y: number };
const BOARD_POSITIONS_KEY = "tracker_board_positions";

export function getBoardPositions(): Record<string, BoardPosition> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(BOARD_POSITIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setBoardPosition(nodeId: string, pos: BoardPosition) {
  if (typeof window === "undefined") return;
  const all = getBoardPositions();
  all[nodeId] = pos;
  window.localStorage.setItem(BOARD_POSITIONS_KEY, JSON.stringify(all));
}

export type BoardColumnSize = { width: number; height: number };
const BOARD_COLUMN_SIZES_KEY = "tracker_board_column_sizes";

export function getBoardColumnSizes(): Record<string, BoardColumnSize> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(BOARD_COLUMN_SIZES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setBoardColumnSize(status: string, size: BoardColumnSize) {
  if (typeof window === "undefined") return;
  const all = getBoardColumnSizes();
  all[status] = size;
  window.localStorage.setItem(BOARD_COLUMN_SIZES_KEY, JSON.stringify(all));
}
