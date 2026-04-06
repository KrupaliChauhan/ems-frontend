import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import Loader from "../../../components/ui/Loader";
import SelectDropdown from "../../../components/ui/SelectDropdown";
import Button from "../../../components/ui/Button";
import LeaveCalendarGrid from "../components/LeaveCalendarGrid";
import LeaveStatusBadge from "../components/LeaveStatusBadge";
import {
  getLeaveCalendar,
  getLeaveEmployees,
  type LeaveCalendarItem,
  type LeaveEmployeeOption,
} from "../services/leaveService";
import { getSession } from "../../auth/services/auth";
import { formatDate } from "../../../utils/date";

const monthOptions = [
  { label: "January", value: "1" },
  { label: "February", value: "2" },
  { label: "March", value: "3" },
  { label: "April", value: "4" },
  { label: "May", value: "5" },
  { label: "June", value: "6" },
  { label: "July", value: "7" },
  { label: "August", value: "8" },
  { label: "September", value: "9" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

export default function LeaveCalendarPage() {
  const { user } = getSession();
  const isEmployee = user?.role === "employee";
  const now = new Date();

  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [employeeId, setEmployeeId] = useState("");
  const [items, setItems] = useState<LeaveCalendarItem[]>([]);
  const [employees, setEmployees] = useState<LeaveEmployeeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const title = useMemo(
    () => `${monthOptions.find((item) => item.value === month)?.label ?? ""} ${year}`,
    [month, year],
  );

  const load = async () => {
    setLoading(true);
    try {
      const [calendarRes, employeeRes] = await Promise.all([
        getLeaveCalendar({
          month: Number(month),
          year: Number(year),
          employeeId,
        }),
        isEmployee ? Promise.resolve({ items: [] as LeaveEmployeeOption[] }) : getLeaveEmployees(),
      ]);

      setItems(calendarRes.items || []);
      setEmployees(employeeRes.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch leave calendar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [month, year, employeeId]);

  const clearFilters = () => {
    setMonth(String(now.getMonth() + 1));
    setYear(String(now.getFullYear()));
    setEmployeeId("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">Leave Calendar</h2>
          <p className="mt-1 text-sm text-slate-500">Visual leave plan with company holidays for the selected month.</p>
        </div>
        <Button variant="outline" onClick={load}>Refresh</Button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SelectDropdown label="Month" value={month} onChange={setMonth} options={monthOptions} />
          <SelectDropdown
            label="Year"
            value={year}
            onChange={setYear}
            options={Array.from({ length: 6 }, (_, index) => {
              const value = String(now.getFullYear() - 2 + index);
              return { label: value, value };
            })}
          />
          {!isEmployee ? (
            <SelectDropdown
              label="Employee"
              value={employeeId}
              onChange={setEmployeeId}
              options={[{ label: "All Employees", value: "" }, ...employees.map((item) => ({ label: item.name, value: item.id }))]}
            />
          ) : null}
          <div className="flex items-end">
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <Loader variant="block" label="Loading leave calendar..." />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">{items.length} approved leave or holiday item(s)</p>
          </div>
          <LeaveCalendarGrid year={Number(year)} month={Number(month)} items={items} />

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Calendar Feed</h3>
            <div className="mt-4 space-y-3">
              {items.length === 0 ? (
                <p className="text-sm text-slate-500">No leave or holiday entries found for this month.</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: item.color }} />
                      <div>
                        {item.kind === "holiday" ? (
                          <>
                            <p className="text-sm font-semibold text-slate-900">{item.leaveTypeName}</p>
                            <p className="text-sm text-slate-500">
                              {formatDate(item.fromDate)}
                              {item.description ? ` · ${item.description}` : ""}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-slate-900">{item.employeeName} · {item.leaveTypeName}</p>
                            <p className="text-sm text-slate-500">{formatDate(item.fromDate)} - {formatDate(item.toDate)} · {item.totalDays} day(s)</p>
                          </>
                        )}
                      </div>
                    </div>
                    {item.kind === "holiday" ? (
                      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Holiday
                      </span>
                    ) : (
                      <LeaveStatusBadge status={item.status!} />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <ConfirmDialog open={!!error} title="Error" message={error} onConfirm={() => setError("")} onCancel={() => setError("")} />
    </div>
  );
}
