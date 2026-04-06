import DataTable from "../../../components/table/DataTable";
import type { Column } from "../../../components/table/DataTable";
import type { ReportColumn, ReportRow } from "../services/reportService";

type ReportTableProps = {
  columns: ReportColumn[];
  rows: ReportRow[];
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

export default function ReportTable({
  columns,
  rows,
  page,
  limit,
  total,
  onPageChange,
  onLimitChange
}: ReportTableProps) {
  const tableColumns: Column<ReportRow>[] = columns.map((column) => ({
    key: column.key,
    label: column.label,
    render: column.render
      ? (value, row) => column.render?.(value, row)
      : undefined
  }));

  return (
    <DataTable
      columns={tableColumns}
      data={rows}
      serverPagination={{
        enabled: true,
        page,
        limit,
        total,
        onPageChange,
        onLimitChange
      }}
    />
  );
}
