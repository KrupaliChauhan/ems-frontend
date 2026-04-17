import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import DataTable from "../../../components/table/DataTable";
import type { Column } from "../../../components/table/DataTable";
import Button from "../../../components/ui/Button";
import DatePicker from "../../../components/ui/DatePicker";
import Loader from "../../../components/ui/Loader";
import SelectDropdown from "../../../components/ui/SelectDropdown";
import { useNotifier } from "../../../components/ui/useNotifier";
import AttendanceStatusBadge from "../components/AttendanceStatusBadge";
import {
  getAttendanceDashboard,
  getAttendanceEmployees,
  listAttendanceRecords,
  recomputeAttendanceDay,
  recomputeAttendanceRange,
  type AttendanceDailySummary
} from "../services/attendanceService";
import { listDepartments, type DepartmentItem } from "../../department/services/departmentService";
import { formatDate } from "../../../utils/date";
import { getSession, hasAccess } from "../../auth/services/auth";

type Row = AttendanceDailySummary & { id: string };

const monthOptions = [
  { label: "All Months", value: "" },
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

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Present", value: "PRESENT" },
  { label: "Half Day", value: "HALF_DAY" },
  { label: "Absent", value: "ABSENT" },
  { label: "Leave", value: "LEAVE" },
  { label: "Holiday", value: "HOLIDAY" },
  { label: "Week Off", value: "WEEK_OFF" },
  { label: "Missed Punch", value: "MISSED_PUNCH" },
  { label: "Half Day Leave + Present", value: "HALF_DAY_LEAVE_PRESENT" }
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

function getEmployeeLabel(employee: Row["employeeId"]) {
  if (!employee || typeof employee === "string") return "--";
  return employee.name || employee.email || "--";
}

function getDepartmentLabel(employee: Row["employeeId"]) {
  if (!employee || typeof employee === "string") return "--";
  const department = employee.department;
  if (!department) return "--";
  if (typeof department === "string") return department;
  return department.name || "--";
}

export default function AttendanceManagementPage() {
  const { user } = getSession();
  const { showError, showSuccess } = useNotifier();
  const isTeamLeader = user?.role === "teamLeader";
  const canRecompute = hasAccess(user?.role, "attendanceManage");
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<
    Array<{ id: string; name: string; departmentId: string; joiningDate?: string | null }>
  >([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [items, setItems] = useState<AttendanceDailySummary[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});

  const [employeeId, setEmployeeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [status, setStatus] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const listRequestRef = useRef(0);
  const metaRequestRef = useRef(0);

  const yearOptions = useMemo(() => {
    return Array.from({ length: 5 }).map((_, index) => {
      const value = String(currentYear - index);
      return { label: value, value };
    }).reverse();
  }, [currentYear]);

  const availableMonthOptions = useMemo(() => {
    if (Number(year) !== currentYear) {
      return monthOptions;
    }

    return monthOptions.filter((option) => option.value === "" || Number(option.value) <= currentMonth);
  }, [currentMonth, currentYear, year]);

  const loadMeta = async () => {
    const requestId = metaRequestRef.current + 1;
    metaRequestRef.current = requestId;

    try {
      const employeeRes = await getAttendanceEmployees();
      const derivedDepartments = new Map<string, DepartmentItem>();
      let departmentItems: DepartmentItem[] = [];

      if (isTeamLeader) {
        (employeeRes.items || []).forEach((item) => {
          if (item.department) {
            derivedDepartments.set(item.department, {
              id: item.department,
              name: item.department,
              status: "Active"
            });
          }
        });
        departmentItems = [...derivedDepartments.values()];
      } else {
        const departmentRes = await listDepartments({ page: 1, limit: 100 });
        departmentItems = departmentRes.items || [];
      }

      if (metaRequestRef.current !== requestId) {
        return;
      }

      setEmployees(
        (employeeRes.items || []).map((item) => ({
          id: item.id,
          name: item.name,
          departmentId: item.department || "",
          joiningDate: item.joiningDate || null
        }))
      );
      setDepartments(departmentItems);
    } catch (e) {
      if (metaRequestRef.current === requestId) {
        showError(e instanceof Error ? e.message : "Failed to load filters");
      }
    }
  };

  const loadData = async () => {
    const requestId = listRequestRef.current + 1;
    listRequestRef.current = requestId;
    setLoading(true);
    try {
      const [recordRes, summaryRes] = await Promise.all([
        listAttendanceRecords({
          employeeId,
          departmentId,
          month: month ? Number(month) : undefined,
          year: year ? Number(year) : undefined,
          status,
          fromDate,
          toDate,
          page,
          limit
        }),
        getAttendanceDashboard({
          employeeId,
          departmentId,
          month: month ? Number(month) : undefined,
          year: year ? Number(year) : undefined,
          fromDate,
          toDate
        })
      ]);

      if (listRequestRef.current !== requestId) {
        return;
      }

      setItems(recordRes.items || []);
      setTotal(recordRes.total || 0);
      setSummary(summaryRes.summary || {});
    } catch (e) {
      if (listRequestRef.current === requestId) {
        showError(e instanceof Error ? e.message : "Failed to load attendance management");
      }
    } finally {
      if (listRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadMeta();
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [departmentId, employeeId, fromDate, limit, month, page, showError, status, toDate, year]);

  useEffect(() => {
    if (Number(year) === currentYear && month && Number(month) > currentMonth) {
      setMonth(String(currentMonth));
      setPage(1);
    }
  }, [currentMonth, currentYear, month, year]);

  useEffect(() => {
    if (fromDate && fromDate > today) {
      setFromDate(today);
    }

    if (toDate && toDate > today) {
      setToDate(today);
    }
  }, [fromDate, toDate, today]);

  useEffect(() => {
    if (fromDate && toDate && fromDate > toDate) {
      setToDate(fromDate);
    }
  }, [fromDate, toDate]);

  const filteredEmployees = useMemo(() => {
    if (!departmentId) return employees;
    return employees.filter((item) => item.departmentId === departmentId);
  }, [departmentId, employees]);
  const selectedEmployee = useMemo(
    () => employees.find((item) => item.id === employeeId) ?? null,
    [employeeId, employees],
  );
  const minimumAllowedDate = selectedEmployee?.joiningDate?.slice(0, 10) || undefined;

  useEffect(() => {
    if (!departmentId) return;
    if (employeeId && !filteredEmployees.some((item) => item.id === employeeId)) {
      setEmployeeId("");
      setPage(1);
    }
  }, [departmentId, employeeId, filteredEmployees]);

  const cards = [
    { label: "Present", value: summary.PRESENT ?? 0, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Absent", value: summary.ABSENT ?? 0, tone: "bg-rose-50 text-rose-700" },
    { label: "Leave", value: summary.LEAVE ?? 0, tone: "bg-sky-50 text-sky-700" },
    { label: "Holiday", value: summary.HOLIDAY ?? 0, tone: "bg-violet-50 text-violet-700" },
    { label: "Weekly Off", value: summary.WEEK_OFF ?? 0, tone: "bg-slate-100 text-slate-700" },
    { label: "Half Day", value: (summary.HALF_DAY ?? 0) + (summary.HALF_DAY_LEAVE_PRESENT ?? 0), tone: "bg-amber-50 text-amber-700" },
    { label: "Missed Punch", value: summary.MISSED_PUNCH ?? 0, tone: "bg-orange-50 text-orange-700" }
  ];

  const columns: Column<Row>[] = [
    { key: "date", label: "Date", render: (value) => formatDate(String(value)) },
    { key: "employeeId", label: "Employee", render: (_, row) => getEmployeeLabel(row.employeeId) },
    { key: "firstIn", label: "First In", render: (value) => formatTime(value as string | null) },
    { key: "lastOut", label: "Last Out", render: (value) => formatTime(value as string | null) },
    { key: "totalWorkMinutes", label: "Worked Time", render: (value) => formatDuration(Number(value ?? 0)) },
    { key: "totalBreakMinutes", label: "Break Time", render: (value) => formatDuration(Number(value ?? 0)) },
    {
      key: "status",
      label: "Status",
      render: (value, row) => (
        <div className="space-y-1">
          <AttendanceStatusBadge status={value as Row["status"]} />
          <p className="text-xs text-slate-500">Department: {getDepartmentLabel(row.employeeId)}</p>
        </div>
      )
    }
  ];

  const clearFilters = () => {
    setEmployeeId("");
    setDepartmentId("");
    setMonth(String(now.getMonth() + 1));
    setYear(String(now.getFullYear()));
    setStatus("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const handleRecomputeRange = async () => {
    if (!fromDate || !toDate) {
      showError("Select both from date and to date to recompute attendance.");
      return;
    }

    try {
      const response = await recomputeAttendanceRange({
        employeeId: employeeId || undefined,
        fromDate,
        toDate
      });
      showSuccess(`Recomputed ${response.attendanceDaysProcessed} attendance day records.`);
      await loadData();
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to recompute attendance");
    }
  };

  if (!hasAccess(user?.role, "attendanceManage")) {
    return <Navigate to="/attendance" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">Attendance Management</h2>
          <p className="mt-1 text-sm text-slate-500">Filter attendance records, inspect computed outcomes, and recompute when policy or punches change.</p>
        </div>
        {canRecompute ? (
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleRecomputeRange}>Recompute Range</Button>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-3xl px-4 py-4 shadow-sm md:px-5 md:py-5 ${card.tone}`}>
            <p className="text-[10px] uppercase tracking-[0.16em] opacity-80 md:text-xs md:tracking-[0.2em]">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold md:mt-3 md:text-3xl">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SelectDropdown
            label="Employee"
            value={employeeId}
            onChange={(value) => {
              setEmployeeId(value);
              setPage(1);
            }}
            options={[{ label: "All Employees", value: "" }, ...filteredEmployees.map((item) => ({ label: item.name, value: item.id }))]}
          />
          <SelectDropdown
            label="Department"
            value={departmentId}
            onChange={(value) => {
              setDepartmentId(value);
              setEmployeeId("");
              setPage(1);
            }}
            options={[{ label: "All Departments", value: "" }, ...departments.map((item) => ({ label: item.name, value: item.id }))]}
          />
          <SelectDropdown
            label="Month"
            value={month}
            onChange={(value) => {
              setMonth(value);
              setPage(1);
            }}
            options={availableMonthOptions}
          />
          <SelectDropdown
            label="Year"
            value={year}
            onChange={(value) => {
              setYear(value);
              setPage(1);
            }}
            options={yearOptions}
          />
          <SelectDropdown
            label="Status"
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={statusOptions}
          />
          <DatePicker
            label="From Date"
            value={fromDate}
            onChange={(value) => {
              if (minimumAllowedDate && value && value < minimumAllowedDate) {
                showError(`Attendance starts from joining date ${formatDate(minimumAllowedDate)}.`);
                return;
              }
              setFromDate(value);
              setPage(1);
            }}
            min={minimumAllowedDate}
            max={today}
            helperText={minimumAllowedDate ? `Joining date: ${formatDate(minimumAllowedDate)}` : undefined}
          />
          <DatePicker
            label="To Date"
            value={toDate}
            onChange={(value) => {
              if (minimumAllowedDate && value && value < minimumAllowedDate) {
                showError(`Attendance starts from joining date ${formatDate(minimumAllowedDate)}.`);
                return;
              }
              setToDate(value);
              setPage(1);
            }}
            min={fromDate || minimumAllowedDate}
            max={today}
            helperText={minimumAllowedDate ? `Joining date: ${formatDate(minimumAllowedDate)}` : undefined}
          />
          <div className="flex items-end">
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      <div className="relative">
        {loading ? <Loader variant="overlay" label="Loading attendance records..." /> : null}
        <DataTable
          columns={columns}
          data={items.map((item) => ({ ...item, id: item._id || item.dateKey }))}
          actions={
            canRecompute
              ? [
                  {
                    label: "Recompute Day",
                    onClick: async (row) => {
                      const employee = row.employeeId;
                      const resolvedEmployeeId = typeof employee === "string" ? employee : employee?._id || employee?.id;
                      if (!resolvedEmployeeId) {
                        showError("Employee id not available for recompute.");
                        return;
                      }

                      try {
                        await recomputeAttendanceDay({
                          employeeId: resolvedEmployeeId,
                          date: row.date
                        });
                        showSuccess("Attendance day recomputed successfully.");
                        await loadData();
                      } catch (e) {
                        showError(e instanceof Error ? e.message : "Failed to recompute attendance day");
                      }
                    }
                  }
                ]
              : undefined
          }
          serverPagination={{
            enabled: true,
            page,
            limit,
            total,
            onPageChange: setPage,
            onLimitChange: setLimit
          }}
        />
      </div>

    </div>
  );
}
