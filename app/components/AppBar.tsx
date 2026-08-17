"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
const HABITS_SUBNAV = [
  { href: "/", label: "Bugün" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/history", label: "Geçmiş" },
];

const HABITS_PATHS = new Set(HABITS_SUBNAV.map((i) => i.href));

const TOP_NAV = [
  { href: "/tasks", label: "Görevler" },
  { href: "/calendar", label: "Calendar" },
  { href: "/settings", label: "Ayarlar" },
];

function HabitsMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = HABITS_PATHS.has(pathname);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          active
            ? "bg-[var(--foreground)] text-[var(--invert)]"
            : "text-[var(--muted)] hover:bg-[var(--surface-2)]"
        }`}
      >
        Habits
        <span aria-hidden className={`text-[9px] transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-1.5 min-w-36 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--overlay)] p-1 shadow-xl backdrop-blur-xl backdrop-saturate-150"
        >
          {HABITS_SUBNAV.map((item) => {
            const itemActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  itemActive
                    ? "bg-[var(--surface-2)] text-[var(--foreground)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AppBar() {
  const pathname = usePathname();

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

        <nav className="flex flex-wrap items-center gap-1">
          <HabitsMenu pathname={pathname} />
          {TOP_NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-[var(--foreground)] text-[var(--invert)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-2)]"
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
