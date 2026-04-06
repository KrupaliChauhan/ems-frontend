import Button from "../../../components/ui/Button";
import type { ReportColumn, ReportRow } from "../services/reportService";

type ExportButtonsProps = {
  title: string;
  columns: ReportColumn[];
  rows: ReportRow[];
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getCellValue(row: ReportRow, column: ReportColumn) {
  const value = row[column.key];
  if (column.exportValue) {
    return String(column.exportValue(value, row) ?? "");
  }

  return String(value ?? "");
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ExportButtons({ title, columns, rows }: ExportButtonsProps) {
  const handleExcelExport = () => {
    const tableHtml = `
      <table>
        <thead>
          <tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr>${columns
                  .map((column) => `<td>${escapeHtml(getCellValue(row, column))}</td>`)
                  .join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;

    const blob = new Blob([tableHtml], {
      type: "application/vnd.ms-excel;charset=utf-8;"
    });
    downloadBlob(blob, `${title.toLowerCase().replace(/\s+/g, "-")}.xls`);
  };

  const handlePdfExport = () => {
    const html = `
      <html>
        <head>
          <title>${escapeHtml(title)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { margin-bottom: 16px; font-size: 22px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 12px; text-align: left; }
            th { background: #e2e8f0; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(title)}</h1>
          <table>
            <thead>
              <tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (row) =>
                    `<tr>${columns
                      .map((column) => `<td>${escapeHtml(getCellValue(row, column))}</td>`)
                      .join("")}</tr>`
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=1024,height=768");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={handleExcelExport}>
        Export Current Page Excel
      </Button>
      <Button variant="outline" onClick={handlePdfExport}>
        Export Current Page PDF
      </Button>
    </div>
  );
}
