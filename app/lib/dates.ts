// Tüm tarihler "takvim günü" kimliği olarak YYYY-MM-DD string'i ile taşınır.
// Hafta her zaman Pazartesi'den Pazar'a kadar 7 gündür. Hesap istemcinin
// (tarayıcının) yerel saatine göre yapılır; sunucu yalnızca gelen tarih
// string'lerini saklar, kendi saat dilimini varsaymaz.

export const DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

export const DAY_LABELS_FULL = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
] as const;

/** Pazartesi=0 ... Pazar=6 sırasına göre haftanın günü indeksi. */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Verilen tarihin (yerel) ait olduğu haftanın Pazartesi gününü döner. */
export function getWeekStart(date: Date): Date {
  const day = date.getDay(); // 0 Paz, 1 Pzt, ... 6 Cmt
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() + diffToMonday);
  return monday;
}

export function getWeekEnd(weekStart: Date): Date {
  const sunday = new Date(weekStart);
  sunday.setDate(sunday.getDate() + 6);
  return sunday;
}

export function getWeekDays(weekStartISO: string): string[] {
  const start = fromISODate(weekStartISO);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return toISODate(d);
  });
}

export function formatWeekRange(weekStartISO: string, weekEndISO: string): string {
  const start = fromISODate(weekStartISO);
  const end = fromISODate(weekEndISO);
  const fmt = (d: Date) => `${d.getDate()} ${MONTHS_TR[d.getMonth()]}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

export const MONTHS_TR = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

// --- Sunucu tarafı (UTC-sabit) yardımcılar ---
// Prisma/veritabanında bir takvim gününü saklarken, o günü her zaman
// UTC gece yarısı olarak temsil ederiz; böylece hangi saat diliminde
// çalışırsa çalışsın sunucu, tarih kimliği bozulmaz.

export function isoToUTCDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function utcDateToISO(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatMonthLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  return `${MONTHS_TR[m - 1]} ${y}`;
}

export function addDaysISO(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function isoDateDiffDays(a: string, b: string): number {
  const da = fromISODate(a).getTime();
  const db = fromISODate(b).getTime();
  return Math.round((db - da) / 86_400_000);
}
