import { useNavigate, useParams } from "react-router-dom";
import { FileSpreadsheet, User } from "lucide-react";
import { Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { faNum, faToman } from "@/lib/fa";
import { faDateLong } from "@/lib/jalali";
import { useReportData } from "@/reports/selectors/dataSource";
import { getPartyStatement } from "@/reports/selectors/receivables";
import {
  ReportLayout,
  ReportErrorState,
  useReport,
  CsvExportButton,
} from "@/reports/components/ReportLayout";
import { ReportTable, ReportTableSkeleton } from "@/reports/components/ReportTable";

/**
 * صورت‌حساب یک طرف حساب (فاز ۶)
 * فقط از تراکنش‌های دفتر حساب می‌خواند؛ اثر فاکتور و چک از قبل در همین
 * تراکنش‌هاست، پس هیچ عدد جداگانه‌ای اضافه نمی‌شود (بدون شمارش مضاعف).
 */
export function PartyStatementPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const data = useReportData();

  const { loading, data: report, error, retry } = useReport(
    () => getPartyStatement(data, id ?? ""),
    [data, id]
  );

  if (error) {
    return (
      <ReportLayout title="صورت‌حساب طرف حساب">
        <ReportErrorState onRetry={retry} />
      </ReportLayout>
    );
  }

  if (!loading && report && !report.person) {
    return (
      <ReportLayout title="صورت‌حساب طرف حساب">
        <div className="card">
          <EmptyState
            icon={<User size={30} aria-hidden />}
            title="طرف حساب پیدا نشد"
            description="ممکن است حذف شده باشد."
            actions={
              <Button variant="secondary" onClick={() => navigate("/bookAccount")}>
                بازگشت به طرف حساب‌ها
              </Button>
            }
          />
        </div>
      </ReportLayout>
    );
  }

  const summary = report?.summary;

  const csvHeaders = [
    "تاریخ",
    "شرح",
    "نوع",
    "بدهکار/بستانکار",
    "مبلغ (تومان)",
    "مانده پس از تراکنش (تومان)",
  ];
  const csvRows =
    report?.rows.map((row) => [
      row.transaction.date,
      row.transaction.description ?? row.typeLabel,
      row.typeLabel,
      row.effect > 0 ? "بدهکار" : "بستانکار",
      row.transaction.amount,
      row.runningBalance,
    ]) ?? [];

  return (
    <ReportLayout
      title={report?.person ? `صورت‌حساب ${report.person.name}` : "صورت‌حساب طرف حساب"}
      subtitle="گردش کامل حساب از دفتر حساب — بدون شمارش مضاعف"
      showRangePicker={false}
      actions={
        <>
          {report?.person && (
            <Button
              variant="secondary"
              size="sm"
              icon={<User size={16} aria-hidden />}
              onClick={() => navigate(`/bookAccount/${report.person!.id}`)}
            >
              جزئیات طرف حساب
            </Button>
          )}
          <CsvExportButton
            fileName={`nasagh-statement-${report?.person?.name ?? "party"}`}
            headers={csvHeaders}
            rows={csvRows}
            disabled={!report || report.rows.length === 0}
          />
        </>
      }
    >
      {!report || loading || !summary ? (
        <section className="page__section" role="status" aria-label="در حال بارگذاری">
          <div className="kpi-grid">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card" style={{ padding: "var(--space-4)" }}>
                <Skeleton width="55%" height={12} />
                <Skeleton width="40%" height={18} className="mt-2" />
              </div>
            ))}
          </div>
          <div className="card mt-4" style={{ padding: "var(--space-4)" }}>
            <ReportTableSkeleton rows={4} cols={5} />
          </div>
        </section>
      ) : (
        <>
          {/* خلاصهٔ حساب */}
          <section className="page__section" aria-label="خلاصهٔ حساب">
            <div className="kpi-grid">
              <div
                className={
                  summary.balance > 0
                    ? "kpi-card kpi-card--receivable"
                    : summary.balance < 0
                      ? "kpi-card kpi-card--debt"
                      : "kpi-card"
                }
              >
                <span className="kpi-card__label">ماندهٔ فعلی</span>
                <strong className="kpi-card__value">{faToman(summary.balance)}</strong>
                <span className="kpi-card__caption">
                  {summary.balance > 0
                    ? "طرف حساب بدهکار است"
                    : summary.balance < 0
                      ? "طرف حساب بستانکار است"
                      : "تسویه‌شده"}
                </span>
              </div>
              <div className="kpi-card">
                <span className="kpi-card__label">مجموع فروش</span>
                <strong className="kpi-card__value">{faToman(summary.totalSales)}</strong>
              </div>
              <div className="kpi-card">
                <span className="kpi-card__label">مجموع خرید</span>
                <strong className="kpi-card__value">{faToman(summary.totalPurchases)}</strong>
              </div>
              <div className="kpi-card">
                <span className="kpi-card__label">دریافت‌شده</span>
                <strong className="kpi-card__value">{faToman(summary.totalReceived)}</strong>
              </div>
              <div className="kpi-card">
                <span className="kpi-card__label">پرداخت‌شده</span>
                <strong className="kpi-card__value">{faToman(summary.totalPaid)}</strong>
              </div>
              <div className="kpi-card">
                <span className="kpi-card__label">ماندهٔ تسویه‌نشده</span>
                <strong className="kpi-card__value">{faToman(Math.abs(summary.balance))}</strong>
                <span className="kpi-card__caption">
                  {summary.balance > 0 ? "طلب ما از طرف حساب" : "بدهی ما به طرف حساب"}
                </span>
              </div>
            </div>
          </section>

          {/* گردش حساب */}
          <section className="page__section" aria-label="گردش حساب">
            <div className="section-head">
              <h2>گردش حساب</h2>
            </div>
            {report.rows.length === 0 ? (
              <div className="card">
                <EmptyState
                  icon={<FileSpreadsheet size={28} aria-hidden />}
                  title="تراکنشی ثبت نشده است"
                  description="برای این طرف حساب هنوز تراکنشی در دفتر حساب نیست."
                />
              </div>
            ) : (
              <div className="card rt-card">
                <ReportTable
                  ariaLabel="گردش حساب طرف حساب"
                  rows={report.rows}
                  rowKey={(row) => row.transaction.id}
                  columns={[
                    {
                      key: "date",
                      header: "تاریخ",
                      render: (row) => faDateLong(row.transaction.date),
                    },
                    {
                      key: "desc",
                      header: "شرح",
                      render: (row) =>
                        row.transaction.description ?? row.typeLabel,
                    },
                    {
                      key: "type",
                      header: "نوع",
                      render: (row) => <Badge tone="outline">{row.typeLabel}</Badge>,
                    },
                    {
                      key: "direction",
                      header: "بدهکار/بستانکار",
                      render: (row) =>
                        row.effect > 0 ? (
                          <Badge tone="warning">بدهکار</Badge>
                        ) : (
                          <Badge tone="info">بستانکار</Badge>
                        ),
                    },
                    {
                      key: "amount",
                      header: "مبلغ",
                      align: "end",
                      render: (row) => faToman(row.transaction.amount),
                    },
                    {
                      key: "running",
                      header: "مانده",
                      align: "end",
                      render: (row) => (
                        <strong>{faNum(row.runningBalance)} تومان</strong>
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
