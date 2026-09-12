import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { cn } from "@/lib/cn";
import { faNum } from "@/lib/fa";
import { faDateLong } from "@/lib/jalali";
import { useReportData } from "@/reports/selectors/dataSource";
import {
  getMovementReport,
  MOVEMENT_FILTER_LABEL,
  type MovementFilter,
} from "@/reports/selectors/inventory";
import { useReportRange } from "@/reports/dateRange/ReportRangeContext";
import {
  ReportLayout,
  ReportErrorState,
  useReport,
  CsvExportButton,
} from "@/reports/components/ReportLayout";
import { ReportTable, ReportTableSkeleton } from "@/reports/components/ReportTable";

const FILTERS: MovementFilter[] = [
  "all",
  "entry",
  "exit",
  "saleInvoice",
  "purchaseInvoice",
  "manualEntry",
  "manualExit",
];

/** گزارش گردش کالا — حرکات انبار با منبع (فاز ۶) */
export function MovementsReportPage() {
  const data = useReportData();
  const { range } = useReportRange();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<MovementFilter>("all");

  const { loading, data: rows, error, retry } = useReport(
    () => getMovementReport(data, range, filter),
    [data, range, filter]
  );

  const totals = useMemo(() => {
    if (!rows) return { entry: 0, exit: 0 };
    let entry = 0;
    let exit = 0;
    for (const row of rows) {
      if (row.movement.type === "ENTRY") entry += row.movement.quantity;
      else exit += row.movement.quantity;
    }
    return { entry, exit };
  }, [rows]);

  if (error) {
    return (
      <ReportLayout title="گردش کالا" subtitle="ورود و خروج انبار با منبع حرکت">
        <ReportErrorState onRetry={retry} />
      </ReportLayout>
    );
  }

  const csvHeaders = [
    "تاریخ",
    "کالا",
    "نوع",
    "تعداد",
    "واحد",
    "منبع",
    "مرجع",
  ];
  const csvRows =
    rows?.map((row) => [
      row.movement.date,
      row.productName,
      row.movement.type === "ENTRY" ? "ورود" : "خروج",
      row.movement.quantity,
      row.movement.unit ?? "",
      row.sourceLabel,
      row.invoiceNumber ?? row.movement.description ?? "",
    ]) ?? [];

  return (
    <ReportLayout
      title="گردش کالا"
      subtitle="حرکات انبار فقط موجودی را تغییر می‌دهند و اثر مالی ندارند"
      actions={
        <CsvExportButton
          fileName="nasagh-movements"
          headers={csvHeaders}
          rows={csvRows}
          disabled={!rows || rows.length === 0}
        />
      }
    >
      {/* فیلترها */}
      <section className="no-print" aria-label="فیلتر حرکات">
        <div className="filter-chips" role="group" aria-label="فیلتر نوع حرکت">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={cn("filter-chip", filter === f && "is-active")}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {MOVEMENT_FILTER_LABEL[f]}
            </button>
          ))}
          {filter !== "all" && (
            <button
              type="button"
              className="filter-chip filter-chip--clear"
              onClick={() => setFilter("all")}
            >
              حذف فیلتر ✕
            </button>
          )}
        </div>
      </section>

      {!rows || loading ? (
        <section className="page__section" role="status" aria-label="در حال بارگذاری">
          <div className="card" style={{ padding: "var(--space-4)" }}>
            <ReportTableSkeleton rows={5} cols={5} />
          </div>
        </section>
      ) : rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<ArrowUpFromLine size={28} aria-hidden />}
            title="حرکتی ثبت نشده است"
            description="در بازه و فیلتر انتخابی، حرکت انباری وجود ندارد."
          />
        </div>
      ) : (
        <>
          {/* جمع بازه */}
          <section className="page__section" aria-label="جمع حرکات">
            <div className="kpi-grid">
              <div className="kpi-card">
                <span className="kpi-card__label">مجموع ورود</span>
                <strong className="kpi-card__value">{faNum(totals.entry)}</strong>
                <span className="kpi-card__caption">در بازه و فیلتر انتخابی</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-card__label">مجموع خروج</span>
                <strong className="kpi-card__value">{faNum(totals.exit)}</strong>
                <span className="kpi-card__caption">در بازه و فیلتر انتخابی</span>
              </div>
            </div>
          </section>

          <section aria-label="فهرست حرکات">
            <div className="card rt-card">
              <ReportTable
                ariaLabel="فهرست حرکات انبار"
                rows={rows}
                rowKey={(row) => row.movement.id}
                onRowClick={(row) =>
                  navigate(
                    row.invoiceId
                      ? `/invoices/invoice/${row.invoiceId}`
                      : `/products/${row.movement.productId}`
                  )
                }
                columns={[
                  {
                    key: "date",
                    header: "تاریخ",
                    render: (row) => faDateLong(row.movement.date),
                  },
                  {
                    key: "product",
                    header: "کالا",
                    render: (row) => <strong>{row.productName}</strong>,
                  },
                  {
                    key: "type",
                    header: "نوع",
                    render: (row) =>
                      row.movement.type === "ENTRY" ? (
                        <StatusBadge tone="success">
                          <ArrowDownToLine size={13} aria-hidden /> ورود
                        </StatusBadge>
                      ) : (
                        <StatusBadge tone="error">
                          <ArrowUpFromLine size={13} aria-hidden /> خروج
                        </StatusBadge>
                      ),
                  },
                  {
                    key: "quantity",
                    header: "تعداد",
                    align: "end",
                    render: (row) => (
                      <span>
                        {faNum(row.movement.quantity)}
                        {row.movement.unit ? ` ${row.movement.unit}` : ""}
                      </span>
                    ),
                  },
                  {
                    key: "source",
                    header: "منبع",
                    render: (row) => <Badge tone="outline">{row.sourceLabel}</Badge>,
                  },
                  {
                    key: "ref",
                    header: "مرجع",
                    render: (row) =>
                      row.invoiceNumber ? (
                        <span dir="ltr">{row.invoiceNumber}</span>
                      ) : (
                        row.movement.description ?? "—"
                      ),
                  },
                ]}
              />
            </div>
          </section>
        </>
      )}
    </ReportLayout>
  );
}
