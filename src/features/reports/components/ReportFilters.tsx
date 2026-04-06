import Button from "../../../components/ui/Button";
import DatePicker from "../../../components/ui/DatePicker";
import SelectDropdown from "../../../components/ui/SelectDropdown";
import type { ReportFilterMeta, ReportFilters, ReportType } from "../services/reportService";

type ReportFiltersProps = {
  reportType: ReportType;
  filters: ReportFilters;
  meta: ReportFilterMeta | null;
  onChange: <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => void;
  onClear: () => void;
};

export default function ReportFilters({
  reportType,
  filters,
  meta,
  onChange,
  onClear
}: ReportFiltersProps) {
  const filteredEmployees = (meta?.employees || []).filter((employee) => {
    if (filters.departmentId && employee.departmentId !== filters.departmentId) {
      return false;
    }
    if (filters.role && employee.role !== filters.role) {
      return false;
    }
    return true;
  });

  const statusOptions = [
    { label: "All Statuses", value: "all" },
    ...((meta?.statuses?.[reportType] || []).map((status) => ({
      label: status,
      value: status
    })))
  ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DatePicker
          label="From Date"
          value={filters.fromDate}
          onChange={(value) => onChange("fromDate", value)}
          max={filters.toDate || undefined}
          lang="en-GB"
        />
        <DatePicker
          label="To Date"
          value={filters.toDate}
          onChange={(value) => onChange("toDate", value)}
          min={filters.fromDate || undefined}
          lang="en-GB"
        />
        <SelectDropdown
          label="Department"
          value={filters.departmentId}
          onChange={(value) => onChange("departmentId", value)}
          options={[
            { label: "All Departments", value: "" },
            ...((meta?.departments || []).map((department) => ({
              label: department.name,
              value: department.id
            })))
          ]}
        />
        <SelectDropdown
          label="Role"
          value={filters.role}
          onChange={(value) => onChange("role", value)}
          options={[
            { label: "All Roles", value: "" },
            ...((meta?.roles || []).map((role) => ({
              label: role.label,
              value: role.value
            })))
          ]}
        />
        <SelectDropdown
          label="Employee"
          value={filters.employeeId}
          onChange={(value) => onChange("employeeId", value)}
          options={[
            { label: "All Employees", value: "" },
            ...filteredEmployees.map((employee) => ({
              label: employee.name,
              value: employee.id
            }))
          ]}
        />
        <SelectDropdown
          label="Status"
          value={filters.status}
          onChange={(value) => onChange("status", value)}
          options={statusOptions}
        />
        <div className="flex items-end">
          <Button variant="outline" onClick={onClear}>
            Clear Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
