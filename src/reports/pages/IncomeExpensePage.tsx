import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HandCoins } from "lucide-react";
import { Badge } from "@/components/ui/Card";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { cn } from "@/lib/cn";
import { faNum, faToman, faTomanCompact, toFaDigits } from "@/lib/fa";
import { faDateLong } from "@/lib/jalali";
import { useReportData } from "@/reports/selectors/dataSource";
import { getIncomeExpenseReport } from "@/reports/selectors/incomeExpense";
import { useReportRange } from "@/reports/dateRange/ReportRangeContext";
import {
  ReportLayout,
  ReportErrorState,
  useReport,
  CsvExportButton,
} from "@/reports/components/ReportLayout";
import { ReportTable, ReportTableSkeleton, ChartSkeleton } from "@/reports/components/ReportTable";
import { DualColumnChart } from "@/reports/charts/DualColumnChart";
import { DonutChart } from "@/reports/charts/DonutChart";
import { ChartCard } from "@/reports/charts/ChartCard";
import { paletteColor } from "@/reports/charts/palette";

/** گزارش درآمد و هزینه — فقط رکوردهای ماژول هزینه‌ها (فاز ۶) */
export function IncomeExpensePage() {
  const data = useReportData();
  const { range } = useReportRange();
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<"all" | "INCOME" | "EXPENSE">("all");

  const { loading, data: report, error, retry } = useReport(
    () => getIncomeExpenseReport(data, range),
    [data, range]
  );

  const filteredRows = useMemo(
    () => (report ? report.rows.filter((r) => typeFilter === "all" || r.type === typeFilter) : []),
    [report, typeFilter]
  );

  if (error) {
    return (
      <ReportLayout title="گزارش درآمد و هزینه" subtitle="رکوردهای ثبت‌شدهٔ عمومی کسب‌وکار">
        <ReportErrorState onRetry={retry} />
      </ReportLayout>
    );
  }

  const csvHeaders = ["عنوان", "نوع", "دسته", "تاریخ", "ساعت", "مبلغ (تومان)"];
  const csvRows = filteredRows.map((r) => [
    r.title,
    r.type === "INCOME" ? "درآمد" : "هزینه",
    r.categoryName,
    r.date,
    r.time,
    r.amount,
  ]);

  return (
    <ReportLayout
      title="گزارش درآمد و هزینه"
      subtitle="فقط رکوردهای ماژول هزینه‌ها و درآمدها — فاکتورها جدا هستند"
      actions={
        <CsvExportButton
          fileName="nasagh-income-expense"
          headers={csvHeaders}
          rows={csvRows}
          disabled={!report || filteredRows.length === 0}
        />
      }
    >
      {!report || loading ? (
        <IncomeExpenseSkeleton />
      ) : report.incomeCount === 0 && report.expenseCount === 0 ? (
        <div className="card">
          <EmptyState
            icon={<HandCoins size={30} aria-hidden />}
            title="در این بازه تراکنشی ثبت نشده است."
            description="هزینه یا درآمدی در بازهٔ انتخابی وجود ندارد."
          />
        </div>
      ) : (
        <>
          {/* شاخص‌ها */}
          <section className="page__section" aria-label="شاخص‌های کلیدی">
            <div className="kpi-grid">
              <div className="kpi-card kpi-card--income">
                <span className="kpi-card__label">مجموع درآمد</span>
                <strong className="kpi-card__value">{faToman(report.incomeTotal)}</strong>
                <span className="kpi-card__caption">{faNum(report.incomeCount)} رکورد</span>
              </div>
              <div className="kpi-card kpi-card--expense">
                <span className="kpi-card__label">مجموع هزینه</span>
                <strong className="kpi-card__value">{faToman(report.expenseTotal)}</strong>
                <span className="kpi-card__caption">{faNum(report.expenseCount)} رکورد</span>
              </div>
              <div className={cn("kpi-card", report.net >= 0 ? "kpi-card--income" : "kpi-card--expense")}>
                <span className="kpi-card__label">خالص درآمد/هزینه</span>
                <strong className="kpi-card__value">{faToman(report.net)}</strong>
                <span className="kpi-card__caption">
                  {report.net >= 0 ? "درآمد بیش از هزینه است" : "هزینه بیش از درآمد است"}
                </span>
              </div>
            </div>
          </section>

          {/* نمودارها */}
          <section className="page__section" aria-label="نمودارها">
            <div className="chart-grid">
              <ChartCard
                title="درآمد و هزینه در طول زمان"
                hasData={report.overTime.some((p) => p.a > 0 || p.b > 0)}
              >
                <DualColumnChart
                  points={report.overTime}
                  ariaLabel="نمودار مقایسهٔ درآمد و هزینه در طول زمان"
                  labelA="درآمد"
                  labelB="هزینه"
                  formatValue={faTomanCompact}
                />
              </ChartCard>

              <ChartCard
                title="دسته‌های درآمد"
                hasData={report.incomeByCategory.length > 0}
                emptyText="درآمدی برای تفکیک وجود ندارد."
              >
                <DonutChart
                  slices={report.incomeByCategory.map((c, i) => ({
                    label: c.label,
                    value: c.value,
                    color: paletteColor(i),
                  }))}
                  ariaLabel="نمودار سهم دسته‌های درآمد"
                  centerLabel="جمع درآمد"
                  centerValue={faTomanCompact(report.incomeTotal)}
                  formatValue={faTomanCompact}
                />
              </ChartCard>

              <ChartCard
                title="دسته‌های هزینه"
                hasData={report.expenseByCategory.length > 0}
                emptyText="هزینه‌ای برای تفکیک وجود ندارد."
              >
                <DonutChart
                  slices={report.expenseByCategory.map((c, i) => ({
                    label: c.label,
                    value: c.value,
                    color: paletteColor(i + 2),
                  }))}
                  ariaLabel="نمودار سهم دسته‌های هزینه"
                  centerLabel="جمع هزینه"
                  centerValue={faTomanCompact(report.expenseTotal)}
                  formatValue={faTomanCompact}
                />
              </ChartCard>
            </div>
          </section>

          {/* جدول رکوردها */}
          <section className="page__section" aria-label="فهرست رکوردها">
            <div className="section-head">
              <h2>رکوردهای بازه</h2>
            </div>

            <div className="filter-chips no-print" role="group" aria-label="فیلتر نوع رکورد">
              {(["all", "INCOME", "EXPENSE"] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  className={cn("filter-chip", typeFilter === tf && "is-active")}
                  aria-pressed={typeFilter === tf}
                  onClick={() => setTypeFilter(tf)}
                >
                  {tf === "all" ? "همه" : tf === "INCOME" ? "درآمد" : "هزینه"}
                </button>
              ))}
              {typeFilter !== "all" && (
                <button
                  type="button"
                  className="filter-chip filter-chip--clear"
                  onClick={() => setTypeFilter("all")}
                >
                  حذف فیلتر ✕
                </button>
              )}
            </div>

            {filteredRows.length === 0 ? (
              <div className="card">
                <EmptyState
                  compact
                  icon={<HandCoins size={26} aria-hidden />}
                  title="رکوردی با این فیلتر نیست"
                  description="فیلتر نوع را تغییر دهید."
                />
              </div>
            ) : (
              <div className="card rt-card">
                <ReportTable
                  ariaLabel="فهرست رکوردهای درآمد و هزینه"
                  rows={filteredRows}
                  rowKey={(r) => r.id}
                  onRowClick={(r) => navigate(`/costs/${r.id}`)}
                  columns={[
                    { key: "title", header: "عنوان", render: (r) => r.title },
                    {
                      key: "type",
                      header: "نوع",
                      render: (r) => (
                        <Badge tone={r.type === "INCOME" ? "success" : "error"}>
                          {r.type === "INCOME" ? "درآمد" : "هزینه"}
                        </Badge>
                      ),
                    },
                    { key: "category", header: "دسته", render: (r) => r.categoryName },
                    {
                      key: "date",
                      header: "تاریخ",
                      render: (r) => `${faDateLong(r.date)} — ${toFaDigits(r.time)}`,
                    },
                    {
                      key: "amount",
                      header: "مبلغ",
                      align: "end",
                      render: (r) => <strong>{faToman(r.amount)}</strong>,
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

function IncomeExpenseSkeleton() {
  return (
    <>
      <section className="page__section" role="status" aria-label="در حال بارگذاری شاخص‌ها">
        <div className="kpi-grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card" style={{ padding: "var(--space-4)" }}>
              <Skeleton width="55%" height={12} />
              <Skeleton width="40%" height={18} className="mt-2" />
            </div>
          ))}
        </div>
      </section>
      <section className="page__section" role="status" aria-label="در حال بارگذاری نمودارها">
        <div className="chart-grid">
          <ChartSkeleton height={190} />
          <ChartSkeleton height={170} />
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
