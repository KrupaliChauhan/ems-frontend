import { ReportModulePage } from "./AttendanceReportPage";
import type { ReportColumn } from "../services/reportService";

const projectColumns: ReportColumn[] = [
  { key: "projectName", label: "Project" },
  { key: "projectStatus", label: "Status" },
  { key: "departmentName", label: "Department" },
  { key: "teamSize", label: "Team Size" },
  { key: "totalTasks", label: "Total Tasks" },
  { key: "completedTasks", label: "Completed" },
  { key: "overdueTasks", label: "Overdue" },
  {
    key: "progress",
    label: "Progress",
    render: (value) => `${value}%`,
    exportValue: (value) => `${value}%`
  }
];

export default function ProjectReportPage() {
  return (
    <ReportModulePage
      config={{
        reportType: "projects",
        title: "Project Report",
        description:
          "Monitor project progress, assigned vs completed tasks, and overdue workloads across teams.",
        columns: projectColumns
      }}
    />
  );
}
