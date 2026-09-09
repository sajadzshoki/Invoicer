import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui/Feedback";

/**
 * جدول گزارش (فاز ۶)
 * - دسکتاپ: جدول تمیز
 * - موبایل: هر ردیف با CSS به کارت تبدیل می‌شود (بدون دام تکراری)
 */

export interface ReportColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "start" | "end" | "center";
}

export interface ReportTableProps<T> {
  columns: Array<ReportColumn<T>>;
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** برچسب دسترسی‌پذیر جدول */
  ariaLabel: string;
  className?: string;
}

export function ReportTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  ariaLabel,
  className,
}: ReportTableProps<T>) {
  const handleKey = (e: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    if (!onRowClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowClick(row);
    }
  };

  return (
    <div className={cn("rt-wrap", className)}>
      <table className="rt" aria-label={ariaLabel}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={col.align ? `rt__${col.align}` : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={cn(onRowClick && "rt-row--interactive")}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={onRowClick ? (e) => handleKey(e, row) : undefined}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  data-label={col.header}
                  className={col.align ? `rt__${col.align}` : undefined}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** اسکلت جدول گزارش — برای حالت بارگذاری */
export function ReportTableSkeleton({
  rows = 4,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div role="status" aria-label="در حال بارگذاری جدول">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="rt-skeleton-row">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} width={c === 0 ? "26%" : "18%"} height={13} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** اسکلت نمودار — برای حالت بارگذاری */
export function ChartSkeleton({ height = 150 }: { height?: number }) {
  return (
    <div role="status" aria-label="در حال بارگذاری نمودار" className="chart-skeleton">
      <Skeleton width="100%" height={height} />
    </div>
  );
}
