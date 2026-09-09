import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, FileSignature } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/Card";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { Tabs } from "@/components/ui/Tabs";
import { cn } from "@/lib/cn";
import { faNum, faToman, faTomanCompact, toFaDigits } from "@/lib/fa";
import { faDateLong } from "@/lib/jalali";
import {
  CHEQUE_STATUS_LABEL,
  CHEQUE_STATUS_TONE,
  CHEQUE_TYPE_LABEL,
} from "@/cheques/helpers";
import type { ChequeType } from "@/cheques/types";
import { useReportData } from "@/reports/selectors/dataSource";
import {
  getChequeReport,
  dueInLabel,
  type ChequeRow,
} from "@/reports/selectors/cheques";
import { useReportRange } from "@/reports/dateRange/ReportRangeContext";
import {
  ReportLayout,
  ReportErrorState,
  useReport,
  CsvExportButton,
} from "@/reports/components/ReportLayout";
import { ReportTable, ReportTableSkeleton } from "@/reports/components/ReportTable";

/** گزارش چک‌ها — کاملاً خواندنی؛ هیچ چک یا یادآوری ساخته نمی‌شود (فاز ۶) */
export function ChequeReportPage() {
  const data = useReportData();
  const { range } = useReportRange();
  const navigate = useNavigate();
  const [typeTab, setTypeTab] = useState<"all" | ChequeType>("all");

  const { loading, data: report, error, retry } = useReport(
    () => getChequeReport(data, range),
    [data, range]
  );

  if (error) {
    return (
      <ReportLayout title="گزارش چک‌ها" subtitle="وضعیت، سررسیدها و تعهدات پرداخت">
        <ReportErrorState onRetry={retry} />
      </ReportLayout>
    );
  }

  const typeRows: ChequeRow[] = !report
    ? []
    : typeTab === "all"
      ? [...report.byType.RECEIVED, ...report.byType.PAID, ...report.byType.TRANSFERRED]
      : report.byType[typeTab];

  const totalCheques = report
    ? report.statusGroups.reduce((s, g) => s + g.count, 0)
    : 0;

  const csvHeaders = [
    "نوع",
    "وضعیت",
    "طرف حساب",
    "بانک",
    "سررسید",
    "مبلغ (تومان)",
  ];
  const csvRows = typeRows.map((row) => [
    CHEQUE_TYPE_LABEL[row.cheque.type],
    CHEQUE_STATUS_LABEL[row.cheque.status],
    row.partyName,
    row.cheque.bank ?? "",
    row.cheque.dueDate,
    row.cheque.amount,
  ]);

  return (
    <ReportLayout
      title="گزارش چک‌ها"
      subtitle="وضعیت چک‌ها بر اساس سررسید در بازهٔ انتخابی"
      actions={
        <CsvExportButton
          fileName="nasagh-cheques"
          headers={csvHeaders}
          rows={csvRows}
          disabled={!report || typeRows.length === 0}
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
            <ReportTableSkeleton rows={4} cols={5} />
          </div>
        </section>
      ) : totalCheques === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FileSignature size={30} aria-hidden />}
            title="چکی برای نمایش وجود ندارد."
            description="در بازهٔ انتخابی چکی با این سررسیدها ثبت نشده است."
          />
        </div>
      ) : (
        <>
          {/* جمع وضعیت‌ها */}
          <section className="page__section" aria-label="وضعیت چک‌ها">
            <div className="kpi-grid">
              {report.statusGroups.map((group) => (
                <div
                  key={group.status}
                  className={cn(
                    "kpi-card",
                    group.status === "PENDING" && "kpi-card--debt",
                    group.status === "RECEIVED" && "kpi-card--income",
                    group.status === "RETURNED" && "kpi-card--expense"
                  )}
                >
                  <span className="kpi-card__label">{CHEQUE_STATUS_LABEL[group.status]}</span>
                  <strong className="kpi-card__value">{faTomanCompact(group.amount)}</strong>
                  <span className="kpi-card__caption">{faNum(group.count)} چک</span>
                </div>
              ))}
            </div>
          </section>

          {/* سررسید نزدیک */}
          <section className="page__section" aria-label="سررسید نزدیک">
            <div className="section-head">
              <h2>سررسید نزدیک</h2>
            </div>
            {report.upcoming.length === 0 ? (
              <div className="card">
                <EmptyState
                  compact
                  icon={<CalendarClock size={26} aria-hidden />}
                  title="سررسید نزدیکی وجود ندارد"
                  description="چک در انتظار وصولی در این بازه نیست."
                />
              </div>
            ) : (
              <div className="card rt-card">
                <ReportTable
                  ariaLabel="چک‌های با سررسید نزدیک"
                  rows={report.upcoming}
                  rowKey={(row) => row.cheque.id}
                  onRowClick={(row) => navigate(`/cheque/${row.cheque.id}`)}
                  columns={chequeColumns()}
                />
              </div>
            )}
          </section>

          {/* تعهدات پرداخت پیش رو */}
          <section className="page__section" aria-label="تعهدات پرداخت پیش رو">
            <div className="section-head">
              <h2>تعهدات پرداخت پیش رو</h2>
            </div>
            {report.upcomingPayments.length === 0 ? (
              <div className="card">
                <EmptyState
                  compact
                  icon={<CalendarClock size={26} aria-hidden />}
                  title="تعهد پرداختی در راه نیست"
                  description="چک پرداختی در انتظار وصولی در این بازه وجود ندارد."
                />
              </div>
            ) : (
              <div className="card rt-card">
                <ReportTable
                  ariaLabel="چک‌های پرداختی در انتظار وصول"
                  rows={report.upcomingPayments}
                  rowKey={(row) => row.cheque.id}
                  onRowClick={(row) => navigate(`/cheque/${row.cheque.id}`)}
                  columns={chequeColumns()}
                />
              </div>
            )}
          </section>

          {/* تفکیک نوع */}
          <section className="page__section" aria-label="فهرست چک‌ها">
            <div className="section-head">
              <h2>همهٔ چک‌ها</h2>
            </div>
            <Tabs
              className="no-print"
              ariaLabel="نوع چک"
              tabs={[
                { id: "all", label: "همه", count: totalCheques },
                { id: "RECEIVED", label: CHEQUE_TYPE_LABEL.RECEIVED, count: report.byType.RECEIVED.length },
                { id: "PAID", label: CHEQUE_TYPE_LABEL.PAID, count: report.byType.PAID.length },
                { id: "TRANSFERRED", label: CHEQUE_TYPE_LABEL.TRANSFERRED, count: report.byType.TRANSFERRED.length },
              ]}
              active={typeTab}
              onChange={(id) => setTypeTab(id as "all" | ChequeType)}
            />
            {typeRows.length === 0 ? (
              <div className="card mt-3">
                <EmptyState
                  compact
                  icon={<FileSignature size={26} aria-hidden />}
                  title="چکی از این نوع نیست"
                  description="در بازهٔ انتخابی چکی با این نوع ثبت نشده است."
                />
              </div>
            ) : (
              <div className="card rt-card mt-3">
                <ReportTable
                  ariaLabel="فهرست چک‌ها"
                  rows={typeRows}
                  rowKey={(row) => row.cheque.id}
                  onRowClick={(row) => navigate(`/cheque/${row.cheque.id}`)}
                  columns={chequeColumns()}
                />
              </div>
            )}
          </section>
        </>
      )}
    </ReportLayout>
  );
}

/* ستون‌های مشترک جدول چک‌ها */
function chequeColumns() {
  return [
    {
      key: "amount",
      header: "مبلغ",
      render: (row: ChequeRow) => <strong>{faToman(row.cheque.amount)}</strong>,
    },
    { key: "party", header: "طرف حساب", render: (row: ChequeRow) => row.partyName },
    {
      key: "due",
      header: "سررسید",
      render: (row: ChequeRow) => (
        <span>
          {faDateLong(row.cheque.dueDate)}
          <span
            className={cn(
              "rt__hint",
              row.daysToDue < 0 && row.cheque.status === "PENDING" && "rt__hint--danger"
            )}
          >
            {" "}
            · {dueInLabel(row.daysToDue)}
          </span>
        </span>
      ),
    },
    {
      key: "bank",
      header: "بانک",
      render: (row: ChequeRow) => row.cheque.bank ?? "—",
    },
    {
      key: "sayad",
      header: "صیادی",
      render: (row: ChequeRow) =>
        row.cheque.sayadiNumber ? (
          <span dir="ltr">{toFaDigits(row.cheque.sayadiNumber.slice(-6))}…</span>
        ) : (
          "—"
        ),
    },
    {
      key: "status",
      header: "وضعیت",
      render: (row: ChequeRow) => (
        <StatusBadge tone={CHEQUE_STATUS_TONE[row.cheque.status]}>
          {CHEQUE_STATUS_LABEL[row.cheque.status]}
        </StatusBadge>
      ),
    },
    {
      key: "type",
      header: "نوع",
      render: (row: ChequeRow) => (
        <Badge tone="outline">{CHEQUE_TYPE_LABEL[row.cheque.type]}</Badge>
      ),
    },
  ];
}
