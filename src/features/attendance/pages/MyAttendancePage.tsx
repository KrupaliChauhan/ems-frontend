import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import DataTable from "../../../components/table/DataTable";
import type { Column } from "../../../components/table/DataTable";
import Button from "../../../components/ui/Button";
import Loader from "../../../components/ui/Loader";
import SelectDropdown from "../../../components/ui/SelectDropdown";
import { useNotifier } from "../../../components/ui/useNotifier";
import AttendanceStatusBadge from "../components/AttendanceStatusBadge";
import { getMyMonthlyAttendance, type AttendanceDailySummary } from "../services/attendanceService";
import { formatDate } from "../../../utils/date";
import { getSession } from "../../auth/services/auth";

type Row = AttendanceDailySummary & { id: string };

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
  { label: "December", value: "12" }
];

function formatTime(value?: string | null) {
  if (!value) return "--";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export default function MyAttendancePage() {
  const { user } = getSession();
  const { showError } = useNotifier();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AttendanceDailySummary[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const requestRef = useRef(0);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }).map((_, index) => {
      const value = String(currentYear - index);
      return { label: value, value };
    }).reverse();
  }, []);

  const availableMonthOptions = useMemo(() => {
    if (Number(year) !== currentYear) {
      return monthOptions;
    }

    return monthOptions.filter((option) => Number(option.value) <= currentMonth);
  }, [currentMonth, currentYear, year]);

  const load = async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true);

    try {
      const data = await getMyMonthlyAttendance({
        month: Number(month),
        year: Number(year)
      });

      if (requestRef.current !== requestId) return;

      setItems(data.items || []);
      setSummary(data.summary || {});
    } catch (e) {
      if (requestRef.current !== requestId) return;
      showError(e instanceof Error ? e.message : "Failed to load monthly attendance");
    } finally {
      if (requestRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    load();
  }, [month, year, showError]);

  useEffect(() => {
    if (Number(year) === currentYear && Number(month) > currentMonth) {
      setMonth(String(currentMonth));
    }
  }, [currentMonth, currentYear, month, year]);

  const clearFilters = () => {
    setMonth(String(now.getMonth() + 1));
    setYear(String(now.getFullYear()));
  };

  const cards = [
    { label: "Present", value: summary.PRESENT ?? 0, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Half Day", value: (summary.HALF_DAY ?? 0) + (summary.HALF_DAY_LEAVE_PRESENT ?? 0), tone: "bg-amber-50 text-amber-700" },
    { label: "Leave", value: summary.LEAVE ?? 0, tone: "bg-sky-50 text-sky-700" },
    { label: "Holiday / Off", value: (summary.HOLIDAY ?? 0) + (summary.WEEK_OFF ?? 0), tone: "bg-slate-900 text-white" }
  ];

  const rows = useMemo(
    () => items.map((item) => ({ ...item, id: item._id || item.dateKey })),
    [items]
  );

  const columns: Column<Row>[] = [
    { key: "date", label: "Date", render: (value) => formatDate(String(value)) },
    { key: "firstIn", label: "First In", render: (value) => formatTime(value as string | null) },
    { key: "lastOut", label: "Last Out", render: (value) => formatTime(value as string | null) },
    { key: "totalWorkMinutes", label: "Worked Time", render: (value) => formatDuration(Number(value ?? 0)) },
    { key: "totalBreakMinutes", label: "Break Time", render: (value) => formatDuration(Number(value ?? 0)) },
    { key: "status", label: "Status", render: (value) => <AttendanceStatusBadge status={value as Row["status"]} /> }
  ];

  if (user?.role !== "employee" && user?.role !== "teamLeader" && user?.role !== "HR") {
    return <Navigate to="/attendance" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">My Attendance</h2>
          <p className="mt-1 text-sm text-slate-500">Review your monthly attendance with backend-calculated statuses.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex w-full flex-col gap-3 md:flex-row xl:max-w-3xl">
          <div className="md:w-56">
            <SelectDropdown
              label="Month"
              value={month}
              onChange={setMonth}
              options={availableMonthOptions}
              className="bg-transparent shadow-none"
            />
          </div>

          <div className="md:w-56">
            <SelectDropdown
              label="Year"
              value={year}
              onChange={setYear}
              options={yearOptions}
              className="bg-transparent shadow-none"
            />
          </div>

          <div className="flex items-end">
            <Button variant="outline" onClick={clearFilters} className="bg-transparent shadow-none hover:bg-white/70">
              Clear
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-3xl px-4 py-4 shadow-sm md:px-5 md:py-5 ${card.tone}`}>
            <p className="text-[10px] uppercase tracking-[0.16em] opacity-80 md:text-xs md:tracking-[0.2em]">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold md:mt-3 md:text-3xl">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        {loading ? <Loader variant="overlay" label="Loading monthly attendance..." /> : null}
        <DataTable columns={columns} data={rows} />
      </div>
    </div>
  );
}


