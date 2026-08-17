import Link from "next/link";
import { getWeekHistory } from "@/app/lib/actions";
import { formatWeekRange } from "@/app/lib/dates";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const weeks = await getWeekHistory();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 font-display text-lg text-[var(--foreground)]">
        Hafta geçmişi
      </h1>

      {weeks.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Henüz kayıtlı hafta yok.</p>
      ) : (
        <ul className="space-y-2">
          {weeks.map((w) => {
            const percent =
              w.totalPossible > 0 ? Math.round((w.totalCompleted / w.totalPossible) * 100) : 0;
            return (
              <li key={w.id}>
                <Link
                  href={`/?week=${w.id}`}
                  className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-3 text-sm shadow-sm backdrop-blur-xl backdrop-saturate-150 transition-all hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-md"
                >
                  <div>
                    <div className="font-medium text-[var(--foreground)]">
                      {formatWeekRange(w.startsOn, w.endsOn)}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {w.state === "open" ? "Açık" : "Kapandı"} · {w.totalCompleted}/{w.totalPossible}
                    </div>
                  </div>
                  <span className="bg-gradient-to-br from-violet-500 via-rose-500 to-emerald-500 bg-clip-text text-sm font-bold tabular-nums text-transparent">
                    {percent}%
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
