import { ReportModulePage } from "./AttendanceReportPage";
import type { ReportColumn } from "../services/reportService";
import { formatDate } from "../../../utils/date";

const assetColumns: ReportColumn[] = [
  { key: "assetCode", label: "Asset Code" },
  { key: "assetName", label: "Asset Name" },
  { key: "category", label: "Category" },
  { key: "brand", label: "Brand" },
  { key: "assetStatus", label: "Status" },
  { key: "allocatedTo", label: "Allocated To" },
  { key: "departmentName", label: "Department" },
  {
    key: "allocatedOn",
    label: "Allocated On",
    render: (value) => (value && value !== "--" ? formatDate(String(value)) : "--"),
    exportValue: (value) => (value && value !== "--" ? formatDate(String(value)) : "--")
  },
  {
    key: "expectedReturnOn",
    label: "Expected Return",
    render: (value) => (value && value !== "--" ? formatDate(String(value)) : "--"),
    exportValue: (value) => (value && value !== "--" ? formatDate(String(value)) : "--")
  }
];

export default function AssetReportPage() {
  return (
    <ReportModulePage
      config={{
        reportType: "assets",
        title: "Asset Report",
        description:
          "Track allocated assets, unassigned stock, pending returns, and asset ownership across departments.",
        columns: assetColumns
      }}
    />
  );
}
