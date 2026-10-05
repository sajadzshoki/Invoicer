import { useMemo, useState, type ReactNode } from "react";
import { Printer, FileDown } from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ErrorState } from "@/components/ui/Feedback";
import {
  ReportRangePicker,
  useReportRange,
} from "@/reports/dateRange/ReportRangeContext";
import { formatReportRange } from "@/reports/dateRange/range";
import { faDateLong, todayIso } from "@/lib/jalali";
import { faTodayLong } from "@/lib/fa";

/**
 * اسکلت صفحهٔ گزارش (فاز ۶)
 * - سربرگ + انتخابگر بازه + ناحیهٔ چاپ
 * - سربرگ چاپ: عنوان، بازه و تاریخ تهیهٔ گزارش
 */

export interface ReportLayoutProps {
  title: string;
  subtitle?: string;
  /** آیا انتخابگر بازه نمایش داده شود؟ (مانده‌های لحظه‌ای ممکن است نخواهند) */
  showRangePicker?: boolean;
  /** اکشن‌های اضافی سربرگ مثل خروجی CSV */
  actions?: ReactNode;
  children: ReactNode;
}

export function ReportLayout({
  title,
  subtitle,
  showRangePicker = true,
  actions,
  children,
}: ReportLayoutProps) {
  const { range } = useReportRange();

  const print = () => window.print();

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        onBack
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={<Printer size={16} aria-hidden />}
              onClick={print}
            >
              چاپ
            </Button>
            {actions}
          </>
        }
      />

      <div className="page print-area">
        {/* سربرگ فقط‌چاپی */}
        <div className="print-header" aria-hidden>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
          <p className="print-header__meta">
            بازهٔ گزارش: {formatReportRange(range)} — تاریخ تهیه: {faTodayLong()}
          </p>
        </div>

        {showRangePicker && <ReportRangePicker className="no-print" />}

        {children}
      </div>
    </>
  );
}

/* ------------------------------ نوار خروجی ------------------------------ */

export interface ExportBarProps {
  fileName: string;
  headers: string[];
  rows: Array<Array<string | number>>;
  /** وقتی داده‌ای برای خروجی نیست */
  disabled?: boolean;
}

/** دکمهٔ خروجی CSV — فایل واقعی در مرورگر می‌سازد، نه ادعای سرویس */
export function CsvExportButton({ fileName, headers, rows, disabled }: ExportBarProps) {
  const { showToast } = useToast();

  const exportCsv = async () => {
    const { buildCsv, downloadCsv } = await import("./csv");
    downloadCsv(fileName, buildCsv(headers, rows));
    showToast({
      title: "خروجی CSV آماده شد",
      description: "فایل روی دستگاه شما ذخیره شد.",
      variant: "success",
    });
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      icon={<FileDown size={16} aria-hidden />}
      onClick={exportCsv}
      disabled={disabled || rows.length === 0}
    >
      خروجی CSV
    </Button>
  );
}

/* ------------------------------ هوک محاسبهٔ امن ------------------------------ */

export interface ReportResult<T> {
  /** هنوز اسکلت نمایش داده شود */
  loading: boolean;
  data: T | null;
  error: boolean;
  retry: () => void;
}

/**
 * محاسبهٔ گزارش با اسکلت کوتاه و مدیریت خطا — بدون کرش کردن اپ
 */
export function useReport<T>(compute: () => T, deps: unknown[]): ReportResult<T> {
  const [attempt, setAttempt] = useState(0);

  const { data, error } = useMemo(() => {
    try {
      return { data: compute(), error: false };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    } catch {
      return { data: null, error: true };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  return {
    loading: false,
    data,
    error,
    retry: () => setAttempt((a) => a + 1),
  };
}

/** حالت خطای استاندارد گزارش‌ها */
export function ReportErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="card report-error-card">
      <ErrorState
        title="خطا در تهیه گزارش"
        description="محاسبهٔ این گزارش با مشکل مواجه شد. دوباره تلاش کنید."
        action={
          <Button variant="secondary" onClick={onRetry}>
            تلاش مجدد
          </Button>
        }
      />
    </div>
  );
}

/** برچسب بازه برای نمایش متنی در صفحه */
export function useRangeHint(): string {
  const { range } = useReportRange();
  return `${faDateLong(range.from)} تا ${faDateLong(range.to)}`;
}

/** امروز — برای برچسب «ماندهٔ لحظه‌ای» */
export function useTodayLabel(): string {
  return faDateLong(todayIso());
}
