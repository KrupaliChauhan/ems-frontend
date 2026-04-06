import { apiRequest } from "../../../services/api";
import type { UserRole } from "../../auth/services/auth";
import type { HolidayScope } from "../utils/holidayScope";

export type LeaveApproverRole = Extract<UserRole, "superadmin" | "admin" | "HR" | "teamLeader">;

export type LeaveApprovalFlowStep = {
  level: number;
  role: LeaveApproverRole;
};

export type LeaveApprovalFlowViewItem = {
  level: number;
  role: LeaveApproverRole;
  status: "WAITING" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  canAct: boolean;
  actedAt?: string | null;
  remarks?: string;
  actedBy?: {
    id: string | null;
    name: string;
    email: string;
  } | null;
};

export type LeaveTypeItem = {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  totalAllocation: number;
  allocationPeriod: "yearly" | "monthly";
  carryForwardEnabled: boolean;
  maxCarryForwardLimit: number;
  accrualEnabled: boolean;
  accrualAmount: number;
  accrualFrequency: "monthly";
  approvalWorkflowType: "single_level" | "multi_level";
  approvalFlowSteps: LeaveApprovalFlowStep[];
  maxDaysPerRequest: number;
  minNoticeDays: number;
  allowPastDates: boolean;
  requiresAttachment: boolean;
  status: "Active" | "Inactive";
  createdAt?: string;
  updatedAt?: string;
};

export type LeaveBalanceItem = {
  cycleKey: string;
  year?: number;
  month?: number | null;
  totalAllocated: number;
  accrued: number;
  carriedForward: number;
  used: number;
  pending: number;
  remaining: number;
  leaveType: LeaveTypeItem;
};

export type LeaveApprovalHistoryItem = {
  level: number;
  action: "Submitted" | "Approved" | "Rejected" | "Cancelled";
  role: UserRole;
  remarks: string;
  actedAt: string;
  by: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type LeaveRequestItem = {
  id: string;
  employee: {
    id: string;
    name: string;
    email: string;
  } | null;
  leaveType: {
    id: string | null;
    name: string;
    code: string;
    color: string;
  };
  fromDate: string;
  toDate: string;
  dayUnit: "FULL" | "HALF";
  totalDays: number;
  reason: string;
  attachment: {
    originalName: string;
    url: string;
    mimeType: string;
    size: number;
  } | null;
  status: "Pending" | "Level 1 Approved" | "Approved" | "Rejected" | "Cancelled";
  allowedActions: Array<"approve" | "reject">;
  canCancel: boolean;
  currentApprovalLevel: number;
  approvalWorkflowType: "single_level" | "multi_level";
  approvalFlowSteps: LeaveApprovalFlowStep[];
  approvalFlow: LeaveApprovalFlowViewItem[];
  nextApprovalRole: LeaveApproverRole | null;
  currentApproverRole: LeaveApproverRole | null;
  currentApproverLabel: string;
  balanceCycleKey: string;
  approvalHistory: LeaveApprovalHistoryItem[];
  createdAt?: string;
  updatedAt?: string;
  cancelledAt?: string | null;
  rejectionReason?: string;
};

export type LeaveEmployeeOption = {
  id: string;
  name: string;
  email: string;
};

export type LeaveCalendarItem = {
  id: string;
  kind: "leave" | "holiday";
  title: string;
  employeeName: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  color: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  status: LeaveRequestItem["status"] | null;
  description: string;
};

export type LeaveHolidayItem = {
  id: string;
  name: string;
  date: string;
  dateKey: string;
  description: string;
  scope: HolidayScope;
  isActive: boolean;
  departmentId?: string | null;
  departmentName?: string;
};

export type LeaveSummaryResponse = {
  summary: Record<string, number>;
  balances?: LeaveBalanceItem[];
  recentRequests?: LeaveRequestItem[];
  topLeaveTypes?: Array<{ leaveTypeName: string; count: number }>;
};

export type LeaveTypePayload = Omit<LeaveTypeItem, "id" | "createdAt" | "updatedAt">;

export async function getLeaveSummary(scope: "self" | "company" = "company") {
  return apiRequest<LeaveSummaryResponse>(`/api/leaves/dashboard/summary?scope=${scope}`, "GET");
}

export async function listLeaveTypes(params?: {
  search?: string;
  status?: "all" | "Active" | "Inactive";
  workflow?: "all" | "single_level" | "multi_level";
}) {
  const qs = new URLSearchParams({
    search: params?.search || "",
    status: params?.status || "all",
    workflow: params?.workflow || "all"
  });

  return apiRequest<{ items: LeaveTypeItem[] }>(`/api/leaves/types?${qs.toString()}`, "GET");
}

export async function listActiveLeaveTypes() {
  return apiRequest<{ items: LeaveTypeItem[] }>("/api/leaves/types/active", "GET");
}

export async function createLeaveType(payload: LeaveTypePayload) {
  return apiRequest<LeaveTypeItem>("/api/leaves/types", "POST", payload);
}

export async function updateLeaveType(id: string, payload: LeaveTypePayload) {
  return apiRequest<LeaveTypeItem>(`/api/leaves/types/${id}`, "PUT", payload);
}

export async function deleteLeaveType(id: string) {
  return apiRequest<{ message: string }>(`/api/leaves/types/${id}`, "DELETE");
}

export async function getMyLeaveBalances() {
  return apiRequest<{ items: LeaveBalanceItem[] }>("/api/leaves/balances/me", "GET");
}

export async function getLeaveEmployees() {
  return apiRequest<{ items: LeaveEmployeeOption[] }>("/api/leaves/employees/options", "GET");
}

export async function applyLeave(payload: FormData) {
  return apiRequest<{ id: string }>("/api/leaves/requests/apply", "POST", payload);
}

export async function listMyLeaveRequests(params: {
  page: number;
  limit: number;
  status?: string;
  leaveTypeId?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const qs = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    status: params.status || "all",
    leaveTypeId: params.leaveTypeId || "",
    fromDate: params.fromDate || "",
    toDate: params.toDate || "",
  });

  return apiRequest<{
    items: LeaveRequestItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/api/leaves/requests/my?${qs.toString()}`, "GET");
}

export async function listLeaveRequests(params: {
  page: number;
  limit: number;
  status?: string;
  leaveTypeId?: string;
  employeeId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}) {
  const qs = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    status: params.status || "all",
    leaveTypeId: params.leaveTypeId || "",
    employeeId: params.employeeId || "",
    fromDate: params.fromDate || "",
    toDate: params.toDate || "",
    search: params.search || "",
  });

  return apiRequest<{
    items: LeaveRequestItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/api/leaves/requests?${qs.toString()}`, "GET");
}

export async function getLeaveRequestById(id: string) {
  return apiRequest<LeaveRequestItem>(`/api/leaves/requests/${id}`, "GET");
}

export async function takeLeaveAction(id: string, payload: { action: "approve" | "reject"; remarks: string }) {
  return apiRequest<{ message: string }>(`/api/leaves/requests/${id}/action`, "POST", payload);
}

export async function cancelLeaveRequest(id: string, remarks = "") {
  return apiRequest<{ message: string }>(`/api/leaves/requests/${id}/cancel`, "POST", { remarks });
}

export async function getLeaveCalendar(params: {
  month: number;
  year: number;
  employeeId?: string;
}) {
  const qs = new URLSearchParams({
    month: String(params.month),
    year: String(params.year),
    employeeId: params.employeeId || "",
    status: "Approved",
  });

  return apiRequest<{ items: LeaveCalendarItem[] }>(`/api/leaves/calendar?${qs.toString()}`, "GET");
}

export async function listLeaveHolidays(params?: {
  month?: number;
  year?: number;
  search?: string;
  scope?: HolidayScope | "";
  isActive?: "all" | "true" | "false";
}) {
  const qs = new URLSearchParams();
  if (params?.month) qs.set("month", String(params.month));
  if (params?.year) qs.set("year", String(params.year));
  if (params?.search) qs.set("search", params.search);
  if (params?.scope) qs.set("scope", params.scope);
  if (params?.isActive) qs.set("isActive", params.isActive);

  return apiRequest<{ items: LeaveHolidayItem[] }>(
    `/api/leaves/holidays${qs.toString() ? `?${qs.toString()}` : ""}`,
    "GET"
  );
}

export async function createLeaveHoliday(payload: {
  name: string;
  date: string;
  description?: string;
  scope?: HolidayScope;
  departmentId?: string;
  isActive?: boolean;
}) {
  return apiRequest<LeaveHolidayItem>("/api/leaves/holidays", "POST", payload);
}

export async function updateLeaveHoliday(
  id: string,
  payload: {
    name: string;
    date: string;
    description?: string;
    scope?: HolidayScope;
    departmentId?: string;
    isActive?: boolean;
  }
) {
  return apiRequest<LeaveHolidayItem>(`/api/leaves/holidays/${id}`, "PUT", payload);
}

export async function deleteLeaveHoliday(id: string) {
  return apiRequest<{ message: string }>(`/api/leaves/holidays/${id}`, "DELETE");
}

export async function runLeaveAutomation(runDate?: string) {
  return apiRequest<{
    runDate: string;
    carryForward: Record<string, number | string>;
    accrual: Record<string, number | string>;
  }>("/api/leaves/automation/process", "POST", runDate ? { runDate } : {});
}
