import type { LeaveCalendarItem } from "../services/leaveService";
import LeaveStatusBadge from "./LeaveStatusBadge";

type Props = {
  year: number;
  month: number;
  items: LeaveCalendarItem[];
};

function sameDate(date: Date, year: number, month: number, day: number) {
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export default function LeaveCalendarGrid({ year, month, items }: Props) {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const daysInMonth = monthEnd.getDate();
  const startWeekday = monthStart.getDay();

  const cells = Array.from({ length: startWeekday + daysInMonth }, (_, index) => {
    if (index < startWeekday) return null;
    return index - startWeekday + 1;
  });

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="grid grid-cols-7 bg-slate-900 text-white text-xs font-semibold uppercase tracking-[0.2em]">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="px-3 py-3 text-center">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 bg-slate-100">
        {cells.map((day, index) => {
          const dayItems =
            day === null
              ? []
              : items.filter((item) => {
                  const from = new Date(item.fromDate);
                  const to = new Date(item.toDate);
                  const current = new Date(year, month - 1, day);
                  from.setHours(0, 0, 0, 0);
                  to.setHours(23, 59, 59, 999);
                  return current >= from && current <= to;
                });

          const isToday =
            day !== null &&
            sameDate(new Date(), year, month, day);

          return (
            <div
              key={`${day ?? "empty"}-${index}`}
              className="min-h-[140px] border border-slate-200 bg-white p-3"
            >
              {day === null ? null : (
                <>
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                        isToday ? "bg-slate-900 text-white" : "text-slate-800"
                      }`}
                    >
                      {day}
                    </span>
                    {dayItems.length ? <span className="text-[11px] text-slate-500">{dayItems.length} item(s)</span> : null}
                  </div>

                  <div className="space-y-2">
                    {dayItems.slice(0, 3).map((item) => (
                      <div key={`${item.id}-${day}`} className="rounded-xl px-2.5 py-2 text-xs text-white" style={{ backgroundColor: item.color }}>
                        <p className="truncate font-semibold">{item.kind === "holiday" ? item.leaveTypeName : item.employeeName}</p>
                        <p className="truncate opacity-90">{item.kind === "holiday" ? "Holiday" : item.leaveTypeCode}</p>
                      </div>
                    ))}
                    {dayItems.length > 3 ? (
                      <div className="rounded-xl bg-slate-100 px-2.5 py-2 text-[11px] font-semibold text-slate-600">
                        +{dayItems.length - 3} more
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
            Holiday
          </span>
          <LeaveStatusBadge status="Approved" />
        </div>
      </div>
    </div>
  );
}
