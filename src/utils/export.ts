import * as XLSX from "xlsx";
import i18n from "@/i18n";
import { useAuthStore } from "@/stores/auth";
import { formatDateTime } from "@/utils/format";

export interface ExportColumn {
  header: string;
  dataKey: string;
}

// Logic to dynamically generate a Grand Total summary row for numeric columns
const generateTotalRow = (columns: ExportColumn[], data: any[]) => {
  const totalRow: any = {};

  columns.forEach((col, index) => {
    if (index === 0) {
      totalRow[col.dataKey] = i18n.global.t("fields.grandTotal");
    } else {
      // Determine if a column purely consists of number values (skipping edge cases like empty records)
      const isNumeric =
        data.length > 0 &&
        data.every((row) => typeof row[col.dataKey] === "number");
      if (isNumeric) {
        totalRow[col.dataKey] = data.reduce(
          (sum, row) => sum + (Number(row[col.dataKey]) || 0),
          0,
        );
      } else {
        totalRow[col.dataKey] = "";
      }
    }
  });

  return totalRow;
};

// Get report metadata for professional headers
const getReportMeta = () => {
  const t = i18n.global.t;
  let username = "";
  try {
    const authStore = useAuthStore();
    username = authStore.user?.username ?? "";
  } catch {
    username = "";
  }
  return {
    generatedBy: username,
    date: formatDateTime(new Date()),
    generatedByLabel: t("reports.generatedBy"),
    dateLabel: t("reports.reportDate"),
    totalRecordsLabel: t("reports.totalRecords"),
  };
};

export const exportToExcel = (
  filename: string,
  columns: ExportColumn[],
  data: any[],
  title: string = "Report",
) => {
  const totalRow = generateTotalRow(columns, data);
  const dataWithTotal = [...data, totalRow];
  const meta = getReportMeta();

  const mappedData = dataWithTotal.map((row) => {
    const formattedRow: any = {};
    columns.forEach((col) => {
      formattedRow[col.header] = row[col.dataKey];
    });
    return formattedRow;
  });

  // Build meta header rows
  const metaRows = [
    [title],
    [],
    [`${meta.dateLabel}: ${meta.date}`],
    [`${meta.generatedByLabel}: ${meta.generatedBy}`],
    [`${meta.totalRecordsLabel}: ${data.length}`],
    [], // blank row before data
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(metaRows);
  // Append column headers + data below the meta rows
  XLSX.utils.sheet_add_json(worksheet, mappedData, {
    origin: `A${metaRows.length + 1}`,
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportToCSV = (
  filename: string,
  columns: ExportColumn[],
  data: any[],
) => {
  const totalRow = generateTotalRow(columns, data);
  const dataWithTotal = [...data, totalRow];

  const mappedData = dataWithTotal.map((row) => {
    const formattedRow: any = {};
    columns.forEach((col) => {
      formattedRow[col.header] = row[col.dataKey];
    });
    return formattedRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(mappedData);
  const csvFormat = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csvFormat], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (
  filename: string,
  columns: ExportColumn[],
  data: any[],
  title: string = "Report",
) => {
  const totalRow = generateTotalRow(columns, data);

  const headers = columns.map((c) => c.header);
  const body = data.map((row) => columns.map((c) => row[c.dataKey]));

  // Append total row at the very end
  body.push(columns.map((c) => totalRow[c.dataKey]));

  const meta = getReportMeta();

  const html = `
    <!DOCTYPE html>
    <html lang="${i18n.global.locale.value}">
      <head>
        <title>${filename}</title>
        <style>
          /* Uses default browser sans-serif which respects Chrome's custom font settings */
          body { font-family: sans-serif; padding: 20px; color: #333; }
          .report-header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #2980b9; padding-bottom: 16px; }
          .report-header h2 { margin: 0 0 12px 0; font-size: 22px; color: #1a1a1a; }
          .report-meta { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; font-size: 12px; color: #555; }
          .report-meta span { display: inline-flex; align-items: center; gap: 4px; }
          .meta-label { font-weight: 600; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          /* Ensure background colors print correctly */
          th { background-color: #2980b9; color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          tr:last-child { font-weight: bold; background-color: #f0f0f0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page {
            margin: 0;
          }
          @media print {
            body { padding: 20mm; }
            th { background-color: #2980b9 !important; color: white !important; }
            tr:last-child { background-color: #f0f0f0 !important; }
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h2>${title}</h2>
          <div class="report-meta">
            <span><span class="meta-label">${meta.dateLabel}:</span> ${meta.date}</span>
            <span><span class="meta-label">${meta.generatedByLabel}:</span> ${meta.generatedBy}</span>
            <span><span class="meta-label">${meta.totalRecordsLabel}:</span> ${data.length}</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${body.map((row) => `<tr>${row.map((cell) => `<td>${cell !== undefined && cell !== null ? cell : ""}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

  // Use a hidden iframe so no blank tab is shown
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.style.left = "-9999px";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (iframeDoc && iframe.contentWindow) {
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
    // Short delay ensures the browser has rendered the HTML before calling print
    setTimeout(() => {
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
      // Clean up the iframe after printing
      document.body.removeChild(iframe);
    }, 250);
  }
};
