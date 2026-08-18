"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const HABITS_PATHS = new Set(["/", "/dashboard", "/history"]);

// Görevler ve Calendar şimdilik kapalı — kullanıcı isteğiyle yalnızca Habits'e
// odaklanılıyor. Sayfaların kendisi silinmedi, sadece nav'dan gizlendi; ileride
// tek satırla geri eklenebilir.
const NAV_ITEMS = [
  { href: "/", label: "Habits", isActive: (p: string) => HABITS_PATHS.has(p) },
  { href: "/settings", label: "Ayarlar", isActive: (p: string) => p === "/settings" },
];

export function AppBar() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; top: number; width: number; height: number } | null>(
    null
  );

  useEffect(() => {
    function measure() {
      const nav = navRef.current;
      if (!nav) return;
      const activeEl = nav.querySelector<HTMLElement>('[data-active="true"]');
      if (activeEl) {
        setIndicator({
          left: activeEl.offsetLeft,
          top: activeEl.offsetTop,
          width: activeEl.offsetWidth,
          height: activeEl.offsetHeight,
        });
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [pathname]);

  if (pathname === "/locked") return null;

  return (
    <header
      className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--surface)] backdrop-blur-xl backdrop-saturate-150"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span
            className="grid h-6 w-6 shrink-0 grid-cols-2 grid-rows-2 gap-[2px] rounded-md bg-[var(--foreground)] p-[3px]"
            aria-hidden
          >
            <span className="rounded-[2px] bg-violet-500" />
            <span className="rounded-[2px] bg-amber-400" />
            <span className="rounded-[2px] bg-rose-500" />
            <span className="rounded-[2px] bg-emerald-500" />
          </span>
          <span className="font-display text-base tracking-tight text-[var(--foreground)]">
            Tracker
          </span>
        </Link>

        <nav ref={navRef} className="relative flex flex-wrap items-center gap-1">
          {indicator && (
            <span
              aria-hidden
              className="absolute rounded-full bg-[var(--foreground)] transition-all duration-300 ease-out"
              style={{ left: indicator.left, top: indicator.top, width: indicator.width, height: indicator.height }}
            />
          )}
          {NAV_ITEMS.map((item) => {
            const active = item.isActive(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-active={active}
                className={`relative z-10 shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-300 ${
                  active ? "text-[var(--invert)]" : "text-[var(--muted)] hover:bg-[var(--surface-2)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
