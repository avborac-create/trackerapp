"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Bugün" },
  { href: "/board", label: "Pano" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/history", label: "Geçmiş" },
];

export function HabitsSubNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-4 flex w-fit gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] p-1">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              active
                ? "bg-[var(--foreground)] text-[var(--invert)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
