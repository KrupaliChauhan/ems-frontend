import { ReportModulePage } from "./AttendanceReportPage";
import type { ReportColumn } from "../services/reportService";
import { formatDate } from "../../../utils/date";

const employeeColumns: ReportColumn[] = [
  { key: "employeeName", label: "Employee" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "departmentName", label: "Department" },
  { key: "designationName", label: "Designation" },
  { key: "status", label: "Status" },
  {
    key: "joinedOn",
    label: "Joined On",
    render: (value) => (value ? formatDate(String(value)) : "--"),
    exportValue: (value) => (value && value !== "--" ? formatDate(String(value)) : "--")
  }
];

export default function EmployeeReportPage() {
  return (
    <ReportModulePage
      config={{
        reportType: "employees",
        title: "Employee Report",
        description:
          "View department-wise users, role distribution, active vs inactive employees, and joining trends.",
        columns: employeeColumns
      }}
    />
  );
}
