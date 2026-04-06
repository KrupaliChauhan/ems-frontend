import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import Loader from "../../../components/ui/Loader";
import { getSession, hasAccess } from "../../auth/services/auth";
import ExportButtons from "../components/ExportButtons";
import ReportFiltersPanel from "../components/ReportFilters";
import ReportSummaryCards from "../components/ReportSummaryCards";
import ReportTable from "../components/ReportTable";
import {
  buildDefaultReportFilters,
  getReportData,
  getReportFilterMeta,
  type ReportColumn,
  type ReportFilterMeta,
  type ReportFilters as ReportFiltersState,
  type ReportResponse,
  type ReportType
} from "../services/reportService";

type ReportPageConfig = {
  reportType: ReportType;
  title: string;
  description: string;
  columns: ReportColumn[];
  showSummary?: boolean;
};

export function ReportModulePage({ config }: { config: ReportPageConfig }) {
  const { user } = getSession();
  const [filters, setFilters] = useState<ReportFiltersState>(buildDefaultReportFilters);
  const [meta, setMeta] = useState<ReportFilterMeta | null>(null);
  const [data, setData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const response = await getReportFilterMeta();
        setMeta(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report filters");
      }
    };

    loadMeta();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await getReportData(config.reportType, filters);
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to load ${config.title.toLowerCase()}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [config.reportType, config.title, filters]);

  const safeColumns = useMemo(() => config.columns, [config.columns]);

  const updateFilter = <K extends keyof ReportFiltersState>(
    key: K,
    value: ReportFiltersState[K]
  ) => {
    setFilters((current: ReportFiltersState) => {
      const next: ReportFiltersState = {
        ...current,
        [key]: value
      };

      if (key !== "page" && key !== "limit") {
        next.page = 1;
      }

      if (key === "departmentId") {
        next.employeeId = "";
      }

      if (key === "role") {
        next.employeeId = "";
      }

      if (key === "fromDate" && next.toDate && String(value) > next.toDate) {
        next.toDate = String(value);
      }

      if (key === "toDate" && next.fromDate && String(value) < next.fromDate) {
        next.fromDate = String(value);
      }

      return next;
    });
  };

  if (!hasAccess(user?.role, "reportsPage")) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">{config.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{config.description}</p>
        </div>
        <ExportButtons title={config.title} columns={safeColumns} rows={data?.items || []} />
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <ReportFiltersPanel
        reportType={config.reportType}
        filters={filters}
        meta={meta}
        onChange={updateFilter}
        onClear={() => setFilters(buildDefaultReportFilters())}
      />

      {config.showSummary !== false ? (
        <ReportSummaryCards summary={data?.summary || []} chart={data?.chart || []} />
      ) : null}

      <div className="relative">
        {loading ? <Loader variant="overlay" label="Loading report..." /> : null}
        <ReportTable
          columns={safeColumns}
          rows={data?.items || []}
          page={filters.page}
          limit={filters.limit}
          total={data?.total || 0}
          onPageChange={(page) => updateFilter("page", page)}
          onLimitChange={(limit) => updateFilter("limit", limit)}
        />
      </div>
    </div>
  );
}

const attendanceColumns: ReportColumn[] = [
  { key: "employeeName", label: "Employee" },
  { key: "departmentName", label: "Department" },
  { key: "role", label: "Role" },
  { key: "attendanceDays", label: "Days" },
  { key: "presentDays", label: "Present" },
  { key: "absentDays", label: "Absent" },
  { key: "leaveDays", label: "Leave" },
  { key: "halfDays", label: "Half Day" },
  { key: "lateLogs", label: "Late Logs" },
  { key: "earlyLogs", label: "Early Logs" },
  { key: "totalHours", label: "Work Hours" },
  { key: "totalBreakHours", label: "Break Hours" }
];

export default function AttendanceReportPage() {
  return (
    <ReportModulePage
      config={{
        reportType: "attendance",
        title: "Attendance Report",
        description:
          "Review monthly attendance trends, late or early logs, absence summaries, and department-wise performance.",
        columns: attendanceColumns,
        showSummary: false
      }}
    />
  );
}
