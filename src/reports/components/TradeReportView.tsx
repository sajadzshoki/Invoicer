import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ReceiptText, ShoppingCart, ArrowLeftRight } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/Card";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { cn } from "@/lib/cn";
import { faNum, faTomanCompact, faToman } from "@/lib/fa";
import { faDateLong, relativeFaDate } from "@/lib/jalali";
import { PAYMENT_TYPE_LABEL } from "@/invoices/helpers";
import type { PaymentType } from "@/invoices/types";
import { useReportData } from "@/reports/selectors/dataSource";
import {
  getSalesReport,
  getPurchaseReport,
  type TradeReport,
} from "@/reports/selectors/trade";
import { useReportRange } from "@/reports/dateRange/ReportRangeContext";
import {
  ReportLayout,
  ReportErrorState,
  useReport,
  CsvExportButton,
} from "@/reports/components/ReportLayout";
import { ReportTable, ReportTableSkeleton, ChartSkeleton } from "./ReportTable";
import { ColumnChart } from "@/reports/charts/ColumnChart";
import { BarListChart } from "@/reports/charts/BarListChart";
import { ChartCard } from "@/reports/charts/ChartCard";

/**
 * نمای مشترک گزارش فروش/خرید (فاز ۶)
 * فروش = فاکتورهای فروش قطعی و خرید = فاکتورهای خرید قطعی؛ بدون پیش‌فاکتور.
 */

export interface TradeReportViewProps {
  kind: "sales" | "purchases";
}

const PAYMENT_FILTERS: Array<PaymentType | "all"> = [
  "all",
  "CASH",
  "CREDIT",
  "INSTALLMENT",
  "CHEQUE",
];

export function TradeReportView({ kind }: TradeReportViewProps) {
  const isSales = kind === "sales";
  const title = isSales ? "گزارش فروش" : "گزارش خرید";
  const subtitle = isSales
    ? "فاکتورهای فروش قطعی — پیش‌فاکتور و چک‌ها جدا هستند"
    : "فاکتورهای خرید قطعی — پیش‌فاکتور و چک‌ها جدا هستند";

  const data = useReportData();
  const { range } = useReportRange();
  const navigate = useNavigate();
  const [paymentFilter, setPaymentFilter] = useState<PaymentType | "all">("all");

  const { loading, data: report, error, retry } = useReport<TradeReport>(
    () =>
      isSales ? getSalesReport(data, range) : getPurchaseReport(data, range),
    [data, range, isSales]
  );

  const filteredInvoices = useMemo(() => {
    if (!report) return [];
    return report.invoices.filter(
      (inv) => paymentFilter === "all" || inv.paymentType === paymentFilter
    );
  }, [report, paymentFilter]);

  if (error) {
    return (
      <ReportLayout title={title} subtitle={subtitle}>
        <ReportErrorState onRetry={retry} />
      </ReportLayout>
    );
  }

  const emptyTitle = isSales ? "هنوز فروش ثبت نشده است." : "هنوز خریدی ثبت نشده است.";
  const emptyDesc = "در بازهٔ انتخابی فاکتور قطعی وجود ندارد. بازه را تغییر دهید یا فاکتور ثبت کنید.";

  const csvHeaders = [
    "شماره فاکتور",
    "طرف حساب",
    "تاریخ",
    "نوع تسویه",
    "مبلغ کل (تومان)",
    "مانده تسویه‌نشده (تومان)",
  ];
  const csvRows = filteredInvoices.map((inv) => [
    inv.invoiceNumber,
    inv.partyName,
    inv.date,
    PAYMENT_TYPE_LABEL[inv.paymentType],
    inv.totalAmount,
    inv.outstanding,
  ]);

  return (
    <ReportLayout
      title={title}
      subtitle={subtitle}
      actions={
        <CsvExportButton
          fileName={isSales ? "nasagh-sales" : "nasagh-purchases"}
          headers={csvHeaders}
          rows={csvRows}
          disabled={!report || filteredInvoices.length === 0}
        />
      }
    >
      {!report || loading ? (
        <TradeSkeleton />
      ) : report.count === 0 ? (
        <div className="card">
          <EmptyState
            icon={isSales ? <ShoppingCart size={30} aria-hidden /> : <ArrowLeftRight size={30} aria-hidden />}
            title={emptyTitle}
            description={emptyDesc}
          />
        </div>
      ) : (
        <>
          {/* شاخص‌های کلیدی */}
          <section className="page__section" aria-label="شاخص‌های کلیدی">
            <div className="kpi-grid">
              <div className="kpi-card kpi-card--lead">
                <span className="kpi-card__label">{isSales ? "مجموع فروش" : "مجموع خرید"}</span>
                <strong className="kpi-card__value">{faToman(report.total)}</strong>
                <span className="kpi-card__caption">{faNum(report.count)} فاکتور</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-card__label">تعداد فاکتور</span>
                <strong className="kpi-card__value">{faNum(report.count)}</strong>
              </div>
              <div className="kpi-card">
                <span className="kpi-card__label">میانگین مبلغ فاکتور</span>
                <strong className="kpi-card__value">{faTomanCompact(report.averageAmount)}</strong>
              </div>
              <div className="kpi-card">
                <span className="kpi-card__label">{isSales ? "فروش نقدی" : "خرید نقدی"}</span>
                <strong className="kpi-card__value">{faTomanCompact(report.byPaymentType.CASH.amount)}</strong>
                <span className="kpi-card__caption">{faNum(report.byPaymentType.CASH.count)} فاکتور</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-card__label">{isSales ? "فروش نسیه" : "خرید نسیه"}</span>
                <strong className="kpi-card__value">{faTomanCompact(report.byPaymentType.CREDIT.amount)}</strong>
                <span className="kpi-card__caption">{faNum(report.byPaymentType.CREDIT.count)} فاکتور</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-card__label">{isSales ? "فروش اقساطی" : "خرید اقساطی"}</span>
                <strong className="kpi-card__value">{faTomanCompact(report.byPaymentType.INSTALLMENT.amount)}</strong>
                <span className="kpi-card__caption">{faNum(report.byPaymentType.INSTALLMENT.count)} فاکتور</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-card__label">{isSales ? "فروش با چک" : "خرید با چک"}</span>
                <strong className="kpi-card__value">{faTomanCompact(report.byPaymentType.CHEQUE.amount)}</strong>
                <span className="kpi-card__caption">{faNum(report.byPaymentType.CHEQUE.count)} فاکتور</span>
              </div>
            </div>
          </section>

          {/* نمودارها */}
          <section className="page__section" aria-label="نمودارها">
            <div className="chart-grid">
              <ChartCard
                title={isSales ? "فروش در طول زمان" : "خرید در طول زمان"}
                caption="بر اساس بازهٔ انتخابی"
                hasData={report.overTime.some((p) => p.value > 0)}
              >
                <ColumnChart
                  points={report.overTime}
                  ariaLabel={isSales ? "نمودار فروش در طول زمان" : "نمودار خرید در طول زمان"}
                  formatValue={faTomanCompact}
                  color={isSales ? "var(--color-primary)" : "var(--color-info)"}
                />
              </ChartCard>

              <ChartCard
                title="به تفکیک دسته"
                hasData={report.byCategory.length > 0}
                emptyText="دسته‌ای برای نمایش وجود ندارد."
              >
                <BarListChart
                  items={report.byCategory}
                  ariaLabel="تفکیک مبلغ بر اساس دسته"
                  formatValue={faTomanCompact}
                />
              </ChartCard>

              <ChartCard
                title="به تفکیک کالا/خدمت"
                caption="۱۰ قلم پرفروش"
                hasData={report.byItem.length > 0}
                emptyText="قلمی برای نمایش وجود ندارد."
              >
                <BarListChart
                  items={report.byItem}
                  ariaLabel="تفکیک مبلغ بر اساس کالا یا خدمت"
                  formatValue={faTomanCompact}
                  limit={10}
                  color={isSales ? "var(--fin-income)" : "var(--fin-expense)"}
                />
              </ChartCard>
            </div>
          </section>

          {/* فیلتر نوع تسویه + جدول فاکتورها */}
          <section className="page__section" aria-label="فهرست فاکتورها">
            <div className="section-head">
              <h2>فاکتورها</h2>
            </div>

            <div className="filter-chips no-print" role="group" aria-label="فیلتر نوع تسویه">
              {PAYMENT_FILTERS.map((pf) => (
                <button
                  key={pf}
                  type="button"
                  className={cn("filter-chip", paymentFilter === pf && "is-active")}
                  aria-pressed={paymentFilter === pf}
                  onClick={() => setPaymentFilter(pf)}
                >
                  {pf === "all" ? "همه" : PAYMENT_TYPE_LABEL[pf]}
                </button>
              ))}
              {paymentFilter !== "all" && (
                <button
                  type="button"
                  className="filter-chip filter-chip--clear"
                  onClick={() => setPaymentFilter("all")}
                >
                  حذف فیلتر ✕
                </button>
              )}
            </div>

            {filteredInvoices.length === 0 ? (
              <div className="card">
                <EmptyState
                  compact
                  icon={<ReceiptText size={26} aria-hidden />}
                  title="فاکتوری با این فیلتر نیست"
                  description="فیلتر نوع تسویه را تغییر دهید."
                />
              </div>
            ) : (
              <div className="card rt-card">
                <ReportTable
                  ariaLabel={isSales ? "فهرست فاکتورهای فروش" : "فهرست فاکتورهای خرید"}
                  rows={filteredInvoices}
                  rowKey={(inv) => inv.id}
                  onRowClick={(inv) => navigate(`/invoices/invoice/${inv.id}`)}
                  columns={[
                    {
                      key: "number",
                      header: "شماره",
                      render: (inv) => <span dir="ltr">{inv.invoiceNumber}</span>,
                    },
                    { key: "party", header: "طرف حساب", render: (inv) => inv.partyName },
                    {
                      key: "date",
                      header: "تاریخ",
                      render: (inv) => (
                        <span>
                          {faDateLong(inv.date)}
                          <span className="rt__hint"> · {relativeFaDate(inv.date)}</span>
                        </span>
                      ),
                    },
                    {
                      key: "payment",
                      header: "تسویه",
                      render: (inv) => (
                        <Badge tone="outline">{PAYMENT_TYPE_LABEL[inv.paymentType]}</Badge>
                      ),
                    },
                    {
                      key: "amount",
                      header: "مبلغ کل",
                      align: "end",
                      render: (inv) => <strong>{faToman(inv.totalAmount)}</strong>,
                    },
                    {
                      key: "outstanding",
                      header: "مانده",
                      align: "end",
                      render: (inv) =>
                        inv.outstanding > 0 ? (
                          <StatusBadge tone="warning">{faTomanCompact(inv.outstanding)}</StatusBadge>
                        ) : (
                          <StatusBadge tone="success">تسویه‌شده</StatusBadge>
                        ),
                    },
                  ]}
                />
              </div>
            )}
          </section>
        </>
      )}
    </ReportLayout>
  );
}

function TradeSkeleton() {
  return (
    <>
      <section className="page__section" role="status" aria-label="در حال بارگذاری شاخص‌ها">
        <div className="kpi-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ padding: "var(--space-4)" }}>
              <Skeleton width="60%" height={12} />
              <Skeleton width="45%" height={18} className="mt-2" />
            </div>
          ))}
        </div>
      </section>
      <section className="page__section" role="status" aria-label="در حال بارگذاری نمودارها">
        <div className="chart-grid">
          <ChartSkeleton height={180} />
          <ChartSkeleton height={150} />
        </div>
      </section>
      <section className="page__section" role="status" aria-label="در حال بارگذاری جدول">
        <div className="card" style={{ padding: "var(--space-4)" }}>
          <ReportTableSkeleton rows={4} cols={5} />
        </div>
      </section>
    </>
  );
}
