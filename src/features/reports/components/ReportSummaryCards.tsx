import type { ReportChartPoint, ReportSummaryCard } from "../services/reportService";

type ReportSummaryCardsProps = {
  summary: ReportSummaryCard[];
  chart: ReportChartPoint[];
};

const toneClasses: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700",
  rose: "bg-rose-50 text-rose-700",
  amber: "bg-amber-50 text-amber-700",
  sky: "bg-sky-50 text-sky-700",
  violet: "bg-violet-50 text-violet-700"
};

export default function ReportSummaryCards({ summary, chart }: ReportSummaryCardsProps) {
  const maxChartValue = chart.reduce((max, item) => Math.max(max, item.value), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summary.map((card) => (
          <div
            key={card.key}
            className={`rounded-3xl px-5 py-5 shadow-sm ${toneClasses[card.tone] || toneClasses.sky}`}
          >
            <p className="text-xs uppercase tracking-[0.2em] opacity-80">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      {chart.length > 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Quick Breakdown</h3>
            <p className="text-sm text-slate-500">Filtered report distribution overview.</p>
          </div>
          <div className="space-y-3">
            {chart.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-teal-600"
                    style={{
                      width: `${maxChartValue > 0 ? Math.max(8, (item.value / maxChartValue) * 100) : 0}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
