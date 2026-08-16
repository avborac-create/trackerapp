import Link from "next/link";
import { getWeekHistory } from "@/app/lib/actions";
import { formatWeekRange } from "@/app/lib/dates";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const weeks = await getWeekHistory();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
          Hafta geçmişi
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Dashboard
          </Link>
          <Link
            href="/"
            className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Bugüne dön
          </Link>
        </div>
      </div>

      {weeks.length === 0 ? (
        <p className="text-sm text-neutral-400">Henüz kayıtlı hafta yok.</p>
      ) : (
        <ul className="space-y-2">
          {weeks.map((w) => {
            const percent = w.totalPossible > 0 ? Math.round((w.totalCompleted / w.totalPossible) * 100) : 0;
            return (
              <li key={w.id}>
                <Link
                  href={`/?week=${w.id}`}
                  className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
                >
                  <div>
                    <div className="font-medium text-neutral-800 dark:text-neutral-100">
                      {formatWeekRange(w.startsOn, w.endsOn)}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {w.state === "open" ? "Açık" : "Kapandı"} · {w.totalCompleted}/{w.totalPossible}
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-neutral-600 dark:text-neutral-300">
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
