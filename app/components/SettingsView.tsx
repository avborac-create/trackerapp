"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const THEME_KEY = "tracker_theme";

const ACCENT_KEY = "tracker_accent";
const ACCENT_PRESETS = [
  { key: "blue", label: "Mavi", accent: "#0a84ff", soft: "#f0f8ff" },
  { key: "indigo", label: "İndigo", accent: "#5e5ce6", soft: "#f2f1fd" },
  { key: "teal", label: "Camgöbeği", accent: "#22b8cf", soft: "#eafbfd" },
  { key: "pink", label: "Pembe", accent: "#ff375f", soft: "#fff0f3" },
  { key: "mint", label: "Nane", accent: "#30d158", soft: "#eefdf1" },
] as const;
type AccentKey = (typeof ACCENT_PRESETS)[number]["key"];

function getInitialTheme(): Theme {
  const stored = window.localStorage.getItem(THEME_KEY);
  return stored === "dark" ? "dark" : "light";
}

function getInitialAccent(): AccentKey {
  const stored = window.localStorage.getItem(ACCENT_KEY) as AccentKey | null;
  return ACCENT_PRESETS.some((p) => p.key === stored) ? (stored as AccentKey) : "blue";
}

export function SettingsView() {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [accent, setAccent] = useState<AccentKey | null>(null);

  useEffect(() => {
    setTheme(getInitialTheme());
    setAccent(getInitialAccent());
  }, []);

  function chooseTheme(t: Theme) {
    document.documentElement.setAttribute("data-theme", t);
    window.localStorage.setItem(THEME_KEY, t);
    setTheme(t);
  }

  function chooseAccent(preset: (typeof ACCENT_PRESETS)[number]) {
    document.documentElement.style.setProperty("--compass", preset.accent);
    document.documentElement.style.setProperty("--compass-soft", preset.soft);
    window.localStorage.setItem(ACCENT_KEY, preset.key);
    setAccent(preset.key);
  }

  if (!theme || !accent) {
    return <div className="mx-auto max-w-2xl px-4 py-8" />;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-4">
      <h1 className="font-display text-lg text-[var(--foreground)]">Ayarlar</h1>
      <p className="mt-1 text-xs text-[var(--muted)]">Görünüm tercihlerin bu cihazda kalıcı olarak saklanır.</p>

      <section className="mt-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 backdrop-blur-xl backdrop-saturate-150">
        <h2 className="font-display text-base text-[var(--foreground)]">Tema</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">Açık veya koyu buzlu cam görünümü arasında seç.</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => chooseTheme("light")}
            aria-pressed={theme === "light"}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
              theme === "light"
                ? "border-[var(--compass)] bg-[var(--compass-soft)] text-[var(--compass)]"
                : "border-[var(--border-subtle)] text-[var(--muted)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <span aria-hidden>☀</span> Açık
          </button>
          <button
            type="button"
            onClick={() => chooseTheme("dark")}
            aria-pressed={theme === "dark"}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
              theme === "dark"
                ? "border-[var(--compass)] bg-[var(--compass-soft)] text-[var(--compass)]"
                : "border-[var(--border-subtle)] text-[var(--muted)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <span aria-hidden>☾</span> Koyu
          </button>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 backdrop-blur-xl backdrop-saturate-150">
        <h2 className="font-display text-base text-[var(--foreground)]">Hakim Renk</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Butonlar, odak halkaları ve tamamlandı işaretleri bu rengi kullanır. Kategori renkleri (mor/sarı/kırmızı/yeşil) bundan etkilenmez.
        </p>
        <div className="mt-4 grid grid-cols-5 gap-2 sm:flex sm:gap-3">
          {ACCENT_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => chooseAccent(p)}
              aria-pressed={accent === p.key}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                aria-hidden
                className="flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-105"
                style={{
                  background: p.accent,
                  boxShadow: accent === p.key ? `0 0 0 3px var(--surface), 0 0 0 5px ${p.accent}` : "none",
                }}
              >
                {accent === p.key && <span className="text-sm font-bold text-white">✓</span>}
              </span>
              <span className="text-[11px] font-medium text-[var(--muted)]">{p.label}</span>
            </button>
          ))}
        </div>
      </section>

      <p className="mt-4 text-xs text-[var(--muted)] opacity-70">Daha fazla tercih yakında burada olacak.</p>
    </div>
  );
}
