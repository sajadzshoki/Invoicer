import { useNavigate } from "react-router-dom";
import { HandCoins, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Card";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { faNum, faToman, faTomanCompact } from "@/lib/fa";
import { faDateLong, relativeFaDate } from "@/lib/jalali";
import { toFaDigits } from "@/lib/fa";
import { useReportData } from "@/reports/selectors/dataSource";
import {
  getReceivablesReport,
  type PartyBalanceRow,
} from "@/reports/selectors/receivables";
import {
  ReportLayout,
  ReportErrorState,
  useReport,
  CsvExportButton,
} from "@/reports/components/ReportLayout";
import { ReportTable, ReportTableSkeleton } from "@/reports/components/ReportTable";
import { Alert } from "@/components/ui/Feedback";

/** طلب و بدهی — مانده‌های لحظه‌ای دفتر حساب (فاز ۶) */
export function ReceivablesPage() {
  const data = useReportData();
  const navigate = useNavigate();

  const { loading, data: report, error, retry } = useReport(
    () => getReceivablesReport(data),
    [data]
  );

  if (error) {
    return (
      <ReportLayout title="طلب و بدهی" subtitle="ماندهٔ بدهکاران و بستانکاران">
        <ReportErrorState onRetry={retry} />
      </ReportLayout>
    );
  }

  const exportRows = (rows: PartyBalanceRow[], kind: string) =>
    rows.map((row) => [
      row.person.name,
      row.person.phone ?? "",
      kind,
      row.summary.balance,
      row.summary.lastTransaction?.date ?? "",
    ]);

  return (
    <ReportLayout
      title="طلب و بدهی"
      subtitle="ماندهٔ بدهکاران و بستانکاران"
      showRangePicker={false}
      actions={
        <CsvExportButton
          fileName="nasagh-receivables-payables"
          headers={["طرف حساب", "تلفن", "وضعیت", "مانده (تومان)", "آخرین تراکنش"]}
          rows={
            report
              ? [
                  ...exportRows(report.debtors, "بدهکار"),
                  ...exportRows(report.creditors, "بستانکار"),
                ]
              : []
          }
          disabled={!report || report.debtors.length + report.creditors.length === 0}
        />
      }
    >
      {!report || loading ? (
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
            <ReportTableSkeleton rows={3} cols={5} />
          </div>
        </section>
      ) : (
        <>
          <section className="page__section" aria-label="نکتهٔ مانده‌ها">
            <Alert
              variant="info"
              title="مانده‌های لحظه‌ای"
              description="طلب و بدهی از مجموع تراکنش‌های دفتر حساب مشتق می‌شوند و به بازهٔ تاریخ محدود نیستند؛ اثر فاکتورها و چک‌ها از قبل در همین تراکنش‌هاست."
            />
          </section>

          {/* شاخص‌ها */}
          <section className="page__section" aria-label="شاخص‌های کلیدی">
            <div className="kpi-grid">
              <div className="kpi-card kpi-card--receivable">
                <span className="kpi-card__label">مجموع طلب</span>
                <strong className="kpi-card__value">{faToman(report.receivableTotal)}</strong>
              </div>
              <div className="kpi-card kpi-card--debt">
                <span className="kpi-card__label">مجموع بدهی</span>
                <strong className="kpi-card__value">{faToman(report.payableTotal)}</strong>
              </div>
              <div className="kpi-card">
                <span className="kpi-card__label">تعداد بدهکاران</span>
                <strong className="kpi-card__value">{faNum(report.debtors.length)}</strong>
                <span className="kpi-card__caption">نفر به ما بدهکارند</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-card__label">تعداد بستانکاران</span>
                <strong className="kpi-card__value">{faNum(report.creditors.length)}</strong>
                <span className="kpi-card__caption">نفر از ما طلبکارند</span>
              </div>
            </div>
          </section>

          {/* طلب */}
          <section className="page__section" aria-label="فهرست طلب‌ها">
            <div className="section-head">
              <h2>طلب — مانده‌های بدهکار</h2>
            </div>
            {report.debtors.length === 0 ? (
              <div className="card">
                <EmptyState
                  compact
                  icon={<HandCoins size={26} aria-hidden />}
                  title="در حال حاضر طلبی وجود ندارد."
                  description="هیچ طرف حسابی ماندهٔ بدهکار ندارد."
                />
              </div>
            ) : (
              <div className="card rt-card">
                <BalanceTable
                  rows={report.debtors}
                  onOpen={(id) => navigate(`/bookAccount/${id}`)}
                  onStatement={(id) => navigate(`/reports/party/${id}`)}
                />
              </div>
            )}
          </section>

          {/* بدهی */}
          <section className="page__section" aria-label="فهرست بدهی‌ها">
            <div className="section-head">
              <h2>بدهی — مانده‌های بستانکار</h2>
            </div>
            {report.creditors.length === 0 ? (
              <div className="card">
                <EmptyState
                  compact
                  icon={<Wallet size={26} aria-hidden />}
                  title="در حال حاضر بدهی‌ای وجود ندارد."
                  description="هیچ طرف حسابی ماندهٔ بستانکار ندارد."
                />
              </div>
            ) : (
              <div className="card rt-card">
                <BalanceTable
                  rows={report.creditors}
                  onOpen={(id) => navigate(`/bookAccount/${id}`)}
                  onStatement={(id) => navigate(`/reports/party/${id}`)}
                />
              </div>
            )}
          </section>
        </>
      )}
    </ReportLayout>
  );
}

/* ------------------------------ جدول مانده‌ها ------------------------------ */

function BalanceTable({
  rows,
  onOpen,
  onStatement,
}: {
  rows: PartyBalanceRow[];
  onOpen: (personId: string) => void;
  onStatement: (personId: string) => void;
}) {
  return (
    <ReportTable
      ariaLabel="فهرست ماندهٔ طرف حساب‌ها"
      rows={rows}
      rowKey={(row) => row.person.id}
      onRowClick={(row) => onOpen(row.person.id)}
      columns={[
        { key: "name", header: "طرف حساب", render: (row) => <strong>{row.person.name}</strong> },
        {
          key: "phone",
          header: "تلفن",
          render: (row) =>
            row.person.phone ? (
              <span dir="ltr">{toFaDigits(row.person.phone)}</span>
            ) : (
              "—"
            ),
        },
        {
          key: "balance",
          header: "مانده",
          align: "end",
          render: (row) => <strong>{faToman(Math.abs(row.summary.balance))}</strong>,
        },
        {
          key: "last",
          header: "آخرین تراکنش",
          render: (row) =>
            row.summary.lastTransaction ? (
              <span>
                {faDateLong(row.summary.lastTransaction.date)}
                <span className="rt__hint"> · {relativeFaDate(row.summary.lastTransaction.date)}</span>
              </span>
            ) : (
              "—"
            ),
        },
        {
          key: "status",
          header: "وضعیت",
          render: (row) =>
            row.summary.balance > 0 ? (
              <StatusBadge tone="warning">بدهکار — {faTomanCompact(row.summary.balance)}</StatusBadge>
            ) : (
              <StatusBadge tone="info">بستانکار — {faTomanCompact(-row.summary.balance)}</StatusBadge>
            ),
        },
        {
          key: "statement",
          header: "صورت‌حساب",
          render: (row) => (
            <Button
              variant="text"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onStatement(row.person.id);
              }}
            >
              مشاهده
            </Button>
          ),
        },
      ]}
    />
  );
}
