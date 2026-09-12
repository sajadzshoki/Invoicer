import { useNavigate } from "react-router-dom";
import { Boxes, PackageX, TriangleAlert } from "lucide-react";
import { Alert, EmptyState, Skeleton } from "@/components/ui/Feedback";
import { StatusBadge } from "@/components/ui/Card";
import { faNum, faToman, faTomanCompact } from "@/lib/fa";
import { STOCK_STATUS_LABEL } from "@/inventory/helpers";
import { useReportData } from "@/reports/selectors/dataSource";
import { getInventoryReport } from "@/reports/selectors/inventory";
import { useReportRange } from "@/reports/dateRange/ReportRangeContext";
import {
  ReportLayout,
  ReportErrorState,
  useReport,
  CsvExportButton,
} from "@/reports/components/ReportLayout";
import { ReportTable, ReportTableSkeleton } from "@/reports/components/ReportTable";

/** گزارش موجودی انبار — ارزش تقریبی، نه ارزش‌گذاری حسابداری (فاز ۶) */
export function InventoryReportPage() {
  const data = useReportData();
  const { range } = useReportRange();
  const navigate = useNavigate();

  const { loading, data: report, error, retry } = useReport(
    () => getInventoryReport(data, range),
    [data, range]
  );

  if (error) {
    return (
      <ReportLayout title="گزارش موجودی" subtitle="وضعیت انبار و ارزش تقریبی">
        <ReportErrorState onRetry={retry} />
      </ReportLayout>
    );
  }

  const csvHeaders = [
    "کالا",
    "موجودی فعلی",
    "واحد",
    "قیمت خرید (تومان)",
    "ارزش تقریبی (تومان)",
    "وضعیت",
  ];
  const csvRows =
    report?.rows.map((row) => [
      row.product.name,
      row.stock,
      row.unit ?? "",
      row.purchasePrice,
      row.estimatedValue,
      STOCK_STATUS_LABEL[row.status],
    ]) ?? [];

  return (
    <ReportLayout
      title="گزارش موجودی"
      subtitle="وضعیت انبار و ارزش تقریبی کالاها"
      actions={
        <CsvExportButton
          fileName="nasagh-inventory"
          headers={csvHeaders}
          rows={csvRows}
          disabled={!report || report.rows.length === 0}
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
      ) : report.productCount === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Boxes size={30} aria-hidden />}
            title="هنوز کالایی ثبت نشده است."
            description="برای دیدن گزارش موجودی، اول کالا ثبت کنید."
          />
        </div>
      ) : (
        <>
          {/* شاخص‌ها */}
          <section className="page__section" aria-label="شاخص‌های انبار">
            <div className="kpi-grid">
              <div className="kpi-card">
                <span className="kpi-card__label">تعداد کالاها</span>
                <strong className="kpi-card__value">{faNum(report.productCount)}</strong>
              </div>
              <div className="kpi-card kpi-card--lead">
                <span className="kpi-card__label">ارزش تقریبی موجودی</span>
                <strong className="kpi-card__value">{faToman(report.estimatedTotalValue)}</strong>
                <span className="kpi-card__caption">موجودی × قیمت خرید</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-card__label">کالاهای کم‌موجودی</span>
                <strong className="kpi-card__value">{faNum(report.lowStockProducts.length)}</strong>
                <span className="kpi-card__caption">در آستانهٔ اتمام</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-card__label">کالاهای ناموجود</span>
                <strong className="kpi-card__value">{faNum(report.outOfStockProducts.length)}</strong>
              </div>
              <div className="kpi-card">
                <span className="kpi-card__label">مجموع ورود در بازه</span>
                <strong className="kpi-card__value">{faNum(report.entriesInRange)}</strong>
              </div>
              <div className="kpi-card">
                <span className="kpi-card__label">مجموع خروج در بازه</span>
                <strong className="kpi-card__value">{faNum(report.exitsInRange)}</strong>
              </div>
            </div>
          </section>

          <section className="page__section" aria-label="نکتهٔ ارزش‌گذاری">
            <Alert
              variant="info"
              title="ارزش تقریبی موجودی"
              description="این رقم فقط موجودی فعلی را در قیمت خرید ضرب می‌کند تا دید کلی بدهد؛ یک ارزش‌گذاری حسابداری رسمی نیست."
            />
          </section>

          {/* هشدارهای موجودی */}
          {(report.lowStockProducts.length > 0 || report.outOfStockProducts.length > 0) && (
            <section className="page__section" aria-label="هشدارهای موجودی">
              <div className="section-head">
                <h2>نیازمند توجه</h2>
              </div>
              <div className="list card" style={{ paddingInline: 0 }}>
                {report.outOfStockProducts.map((p) => (
                  <div key={p.id} className="list-item">
                    <span className="list-item__icon" aria-hidden>
                      <PackageX size={18} />
                    </span>
                    <span className="list-item__body">
                      <span className="list-item__title">{p.name}</span>
                      <span className="list-item__caption">موجودی تمام شده است</span>
                    </span>
                    <StatusBadge tone="error">{STOCK_STATUS_LABEL.out}</StatusBadge>
                  </div>
                ))}
                {report.lowStockProducts.map((p) => (
                  <div key={p.id} className="list-item">
                    <span className="list-item__icon" aria-hidden>
                      <TriangleAlert size={18} />
                    </span>
                    <span className="list-item__body">
                      <span className="list-item__title">{p.name}</span>
                      <span className="list-item__caption">
                        {faNum(p.currentStock ?? 0)} عدد باقی مانده
                      </span>
                    </span>
                    <StatusBadge tone="warning">{STOCK_STATUS_LABEL.low}</StatusBadge>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* جدول کالاها */}
          <section className="page__section" aria-label="فهرست کالاها">
            <div className="section-head">
              <h2>کالاها</h2>
            </div>
            <div className="card rt-card">
              <ReportTable
                ariaLabel="فهرست کالاهای انبار"
                rows={report.rows}
                rowKey={(row) => row.product.id}
                onRowClick={(row) => navigate(`/products/${row.product.id}`)}
                columns={[
                  {
                    key: "name",
                    header: "کالا",
                    render: (row) => <strong>{row.product.name}</strong>,
                  },
                  {
                    key: "stock",
                    header: "موجودی فعلی",
                    align: "end",
                    render: (row) =>
                      `${faNum(row.stock)}${row.unit ? ` ${row.unit}` : ""}`,
                  },
                  {
                    key: "price",
                    header: "قیمت خرید",
                    align: "end",
                    render: (row) => faToman(row.purchasePrice),
                  },
                  {
                    key: "value",
                    header: "ارزش تقریبی",
                    align: "end",
                    render: (row) => (
                      <strong>{faTomanCompact(row.estimatedValue)}</strong>
                    ),
                  },
                  {
                    key: "status",
                    header: "وضعیت",
                    render: (row) =>
                      row.status === "out" ? (
                        <StatusBadge tone="error">{STOCK_STATUS_LABEL.out}</StatusBadge>
                      ) : row.status === "low" ? (
                        <StatusBadge tone="warning">{STOCK_STATUS_LABEL.low}</StatusBadge>
                      ) : (
                        <StatusBadge tone="success">{STOCK_STATUS_LABEL.in}</StatusBadge>
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
