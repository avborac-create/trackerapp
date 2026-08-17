import { getDashboardStats } from "@/app/lib/actions";
import { formatMonthLabel } from "@/app/lib/dates";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { months, rows } = await getDashboardStats();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 font-display text-lg text-[var(--foreground)]">
        Dashboard
      </h1>

      {rows.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          Henüz istatistik oluşturacak kadar veri yok. En az bir hafta kapatınca burada aylık
          oranlar görünecek.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-2)]">
                <th className="sticky left-0 bg-[var(--surface-2)] px-3 py-2 text-left font-medium text-[var(--muted)]">
                  Eylem
                </th>
                {months.map((m) => (
                  <th
                    key={m}
                    className="px-3 py-2 text-right font-medium text-[var(--muted)]"
                  >
                    {formatMonthLabel(m)}
                  </th>
                ))}
                <th className="px-3 py-2 text-right font-medium text-[var(--muted)]">
                  Toplam
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const totalPercent =
                  row.totalPossible > 0
                    ? Math.round((row.totalCompleted / row.totalPossible) * 100)
                    : 0;
                return (
                  <tr
                    key={row.nodeId}
                    className="border-b border-[var(--border-subtle)] transition-colors last:border-0 hover:bg-[var(--surface-2)]"
                  >
                    <td className="sticky left-0 bg-[var(--surface)] px-3 py-2 font-medium text-[var(--foreground)]">
                      {row.title}
                    </td>
                    {months.map((m) => {
                      const cell = row.cells[m];
                      return (
                        <td
                          key={m}
                          className="px-3 py-2 text-right tabular-nums text-[var(--muted)]"
                        >
                          {cell ? `${cell.percent}%` : "–"}
                        </td>
                      );
                    })}
                    <td className="bg-gradient-to-br from-violet-500 via-rose-500 to-emerald-500 bg-clip-text px-3 py-2 text-right font-bold tabular-nums text-transparent">
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
