import Link from "next/link";
import { getDashboardStats } from "@/app/lib/actions";
import { formatMonthLabel } from "@/app/lib/dates";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { months, rows } = await getDashboardStats();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
          Dashboard
        </h1>
        <Link
          href="/"
          className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Bugüne dön
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-neutral-400">
          Henüz istatistik oluşturacak kadar veri yok. En az bir hafta kapatınca burada aylık
          oranlar görünecek.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                <th className="sticky left-0 bg-neutral-50 px-3 py-2 text-left font-medium text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
                  Düğüm
                </th>
                {months.map((m) => (
                  <th
                    key={m}
                    className="px-3 py-2 text-right font-medium text-neutral-600 dark:text-neutral-300"
                  >
                    {formatMonthLabel(m)}
                  </th>
                ))}
                <th className="px-3 py-2 text-right font-medium text-neutral-600 dark:text-neutral-300">
                  Toplam
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const totalPercent =
                  row.totalPossible > 0 ? Math.round((row.totalCompleted / row.totalPossible) * 100) : 0;
                return (
                  <tr key={row.nodeId} className="border-b border-neutral-100 last:border-0 dark:border-neutral-900">
                    <td className="sticky left-0 bg-white px-3 py-2 font-medium text-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
                      {row.title}
                    </td>
                    {months.map((m) => {
                      const cell = row.cells[m];
                      return (
                        <td key={m} className="px-3 py-2 text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                          {cell ? `${cell.percent}%` : "–"}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-neutral-800 dark:text-neutral-100">
                      {totalPercent}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
