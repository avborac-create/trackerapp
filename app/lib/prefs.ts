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
