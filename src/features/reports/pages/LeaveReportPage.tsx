import { ReportModulePage } from "./AttendanceReportPage";
import type { ReportColumn } from "../services/reportService";

const leaveColumns: ReportColumn[] = [
  { key: "employeeName", label: "Employee" },
  { key: "departmentName", label: "Department" },
  { key: "role", label: "Role" },
  { key: "leaveType", label: "Leave Type" },
  { key: "allocated", label: "Allocated" },
  { key: "used", label: "Used" },
  { key: "pending", label: "Pending" },
  { key: "remaining", label: "Remaining" },
  { key: "approvedRequests", label: "Approved Requests" },
  { key: "pendingRequests", label: "Pending Requests" }
];

export default function LeaveReportPage() {
  return (
    <ReportModulePage
      config={{
        reportType: "leave",
        title: "Leave Report",
        description:
          "Track leave balances, request status distribution, and leave usage across employees and departments.",
        columns: leaveColumns,
        showSummary: false
      }}
    />
  );
}
