/**
 * خروجی CSV گزارش‌ها (فاز ۶)
 * - بدون هیچ سرویس خارجی؛ فقط ساخت فایل در مرورگر
 * - با BOM برای سازگاری فارسی در اکسل
 * - اعداد برای تبادل داده لاتین می‌مانند؛ متن فارسی است
 */

export type CsvCell = string | number;

function escapeCell(cell: CsvCell): string {
  const s = String(cell);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildCsv(headers: string[], rows: CsvCell[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(","));
  // BOM برای تشخیص درست یوتی‌کد در اکسل
  return "\uFEFF" + lines.join("\r\n");
}

export function downloadCsv(fileName: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
