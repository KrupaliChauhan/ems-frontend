import { apiRequest } from "../../../services/api";

export type ReportType = "attendance" | "leave" | "assets" | "projects" | "employees";

export type ReportFilters = {
  fromDate: string;
  toDate: string;
  employeeId: string;
  departmentId: string;
  role: string;
  status: string;
  page: number;
  limit: number;
};

export type ReportSummaryCard = {
  key: string;
  label: string;
  value: number;
  tone: string;
};

export type ReportChartPoint = {
  label: string;
  value: number;
};

export type ReportRow = {
  id: string;
  [key: string]: unknown;
};

export type ReportResponse = {
  summary: ReportSummaryCard[];
  chart: ReportChartPoint[];
  items: ReportRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filtersApplied: {
    fromDate: string;
    toDate: string;
    employeeId: string;
    departmentId: string;
    role: string;
    status: string;
  };
};

export type ReportFilterMeta = {
  employees: Array<{
    id: string;
    name: string;
    role: string;
    departmentId: string;
    departmentName: string;
  }>;
  departments: Array<{
    id: string;
    name: string;
  }>;
  roles: Array<{
    label: string;
    value: string;
  }>;
  statuses: Record<ReportType, string[]>;
};

export type ReportColumn = {
  key: string;
  label: string;
  render?: (value: unknown, row: ReportRow) => React.ReactNode;
  exportValue?: (value: unknown, row: ReportRow) => string | number;
};

export function buildDefaultReportFilters(): ReportFilters {
  const today = new Date();
  const fromDate = new Date(today);
  fromDate.setDate(today.getDate() - 30);

  return {
    fromDate: fromDate.toISOString().slice(0, 10),
    toDate: today.toISOString().slice(0, 10),
    employeeId: "",
    departmentId: "",
    role: "",
    status: "all",
    page: 1,
    limit: 10
  };
}

export async function getReportFilterMeta() {
  return apiRequest<ReportFilterMeta>("/api/reports/filters", "GET");
}

export async function getReportData(reportType: ReportType, filters: ReportFilters) {
  const qs = new URLSearchParams({
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    employeeId: filters.employeeId,
    departmentId: filters.departmentId,
    role: filters.role,
    status: filters.status,
    page: String(filters.page),
    limit: String(filters.limit)
  });

  return apiRequest<ReportResponse>(`/api/reports/${reportType}?${qs.toString()}`, "GET");
}
