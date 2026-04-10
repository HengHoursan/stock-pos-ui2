import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn {
  header: string;
  dataKey: string;
}

// Logic to dynamically generate a Grand Total summary row for numeric columns
const generateTotalRow = (columns: ExportColumn[], data: any[]) => {
  const totalRow: any = {};
  
  columns.forEach((col, index) => {
    if (index === 0) {
      totalRow[col.dataKey] = 'Grand Total';
    } else {
      // Determine if a column purely consists of number values (skipping edge cases like empty records)
      const isNumeric = data.length > 0 && data.every(row => typeof row[col.dataKey] === 'number');
      if (isNumeric) {
        totalRow[col.dataKey] = data.reduce((sum, row) => sum + (Number(row[col.dataKey]) || 0), 0);
      } else {
        totalRow[col.dataKey] = '';
      }
    }
  });
  
  return totalRow;
};

export const exportToExcel = (filename: string, columns: ExportColumn[], data: any[]) => {
  const totalRow = generateTotalRow(columns, data);
  const dataWithTotal = [...data, totalRow];
  
  const mappedData = dataWithTotal.map(row => {
    const formattedRow: any = {};
    columns.forEach(col => {
      formattedRow[col.header] = row[col.dataKey];
    });
    return formattedRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(mappedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportToCSV = (filename: string, columns: ExportColumn[], data: any[]) => {
  const totalRow = generateTotalRow(columns, data);
  const dataWithTotal = [...data, totalRow];
  
  const mappedData = dataWithTotal.map(row => {
    const formattedRow: any = {};
    columns.forEach(col => {
      formattedRow[col.header] = row[col.dataKey];
    });
    return formattedRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(mappedData);
  const csvFormat = XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csvFormat], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (filename: string, columns: ExportColumn[], data: any[], title: string = 'Report') => {
  const doc = new jsPDF();
  const totalRow = generateTotalRow(columns, data);
  
  const headers = columns.map(c => c.header);
  const body = data.map(row => columns.map(c => row[c.dataKey]));
  
  // Append total row at the very end
  body.push(columns.map(c => totalRow[c.dataKey]));

  doc.text(title, 14, 15);
  
  autoTable(doc, {
    startY: 20,
    head: [headers],
    body: body,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    footStyles: { fillColor: [240, 240, 240] },
    // Custom logic to highlight the grand total row
    didParseCell: function (data) {
      if (data.row.index === body.length - 1) {
        data.cell.styles.fillColor = [220, 220, 220];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  doc.save(`${filename}.pdf`);
};
