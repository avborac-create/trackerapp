import type { Category } from "@/app/lib/types";

// Kategori renk kimliği: Eşlikçi=mor, Multi=sarı, Aktif=kırmızı, Pasif=yeşil.
// Tailwind JIT için tüm sınıf adları literal string olarak yazılmalı (dinamik
// birleştirme yapılmaz), bu yüzden her kategori için tam sınıf seti burada.
export const CATEGORY_THEME: Record<
  Category,
  {
    dot: string;
    text: string;
    chipBg: string;
    fill: string;
    barFrom: string;
    barTo: string;
    ring: string;
    softBg: string;
    softBorder: string;
  }
> = {
  companion: {
    dot: "bg-violet-500",
    text: "text-violet-600 dark:text-violet-400",
    chipBg: "bg-violet-100 dark:bg-violet-500/15",
    fill: "bg-violet-500",
    barFrom: "from-violet-400",
    barTo: "to-violet-600",
    ring: "ring-violet-500",
    softBg: "bg-violet-50/60 dark:bg-violet-500/[0.06]",
    softBorder: "border-violet-200/70 dark:border-violet-500/20",
  },
  multi: {
    dot: "bg-amber-400",
    text: "text-amber-600 dark:text-amber-400",
    chipBg: "bg-amber-100 dark:bg-amber-400/15",
    fill: "bg-amber-400",
    barFrom: "from-amber-300",
    barTo: "to-amber-500",
    ring: "ring-amber-400",
    softBg: "bg-amber-50/60 dark:bg-amber-400/[0.06]",
    softBorder: "border-amber-200/70 dark:border-amber-400/20",
  },
  active: {
    dot: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    chipBg: "bg-rose-100 dark:bg-rose-500/15",
    fill: "bg-rose-500",
    barFrom: "from-rose-400",
    barTo: "to-rose-600",
    ring: "ring-rose-500",
    softBg: "bg-rose-50/60 dark:bg-rose-500/[0.06]",
    softBorder: "border-rose-200/70 dark:border-rose-500/20",
  },
  passive: {
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    chipBg: "bg-emerald-100 dark:bg-emerald-500/15",
    fill: "bg-emerald-500",
    barFrom: "from-emerald-400",
    barTo: "to-emerald-600",
    ring: "ring-emerald-500",
    softBg: "bg-emerald-50/60 dark:bg-emerald-500/[0.06]",
    softBorder: "border-emerald-200/70 dark:border-emerald-500/20",
  },
};
