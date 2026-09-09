
import { useNavigate } from "react-router-dom";
import { Alert, Skeleton } from "@/components/ui/Feedback";
import { cn } from "@/lib/cn";
import { faNum, faToman, faTomanCompact } from "@/lib/fa";
import { useReportData } from "@/reports/selectors/dataSource";
import { getProfitLossReport } from "@/reports/selectors/profitLoss";
import { useReportRange } from "@/reports/dateRange/ReportRangeContext";
import {
  ReportLayout,
  ReportErrorState,
  useReport,
} from "@/reports/components/ReportLayout";

/**
 * سود و زیان (فاز ۶)
 *
 * شفاف و بدون اختراع قواعد جدید:
 * - خالص ثبت‌شده = درآمد − هزینه (از ماژول هزینه‌ها و درآمدها)
 * - فروش و خرید جدا نمایش داده می‌شوند؛ فروش−خرید فقط یک «شاخص مشتق» است
 */
export function ProfitLossPage() {
  const data = useReportData();
  const { range } = useReportRange();
  const navigate = useNavigate();

  const { loading, data: report, error, retry } = useReport(
    () => getProfitLossReport(data, range),
    [data, range]
  );

  if (error) {
    return (
      <ReportLayout title="سود و زیان" subtitle="خالص ثبت‌شده و نمای فروش/خرید">
        <ReportErrorState onRetry={retry} />
      </ReportLayout>
    );
  }

  return (
    <ReportLayout title="سود و زیان" subtitle="خالص ثبت‌شده و نمای فروش/خرید">
      {!report || loading ? (
        <section className="page__section" role="status" aria-label="در حال بارگذاری">
          <div className="kpi-grid">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card" style={{ padding: "var(--space-4)" }}>
                <Skeleton width="55%" height={12} />
                <Skeleton width="40%" height={18} className="mt-2" />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <>
          {/* خالص ثبت‌شده */}
          <section className="page__section" aria-label="درآمد و هزینهٔ ثبت‌شده">
            <div className="section-head">
              <h2>درآمدها و هزینه‌های ثبت‌شده</h2>
            </div>
            <div className="kpi-grid">
              <button
                type="button"
                className="kpi-card kpi-card--income kpi-card--link"
                onClick={() => navigate("/reports/income-expense")}
              >
                <span className="kpi-card__label">درآمد ثبت‌شده</span>
                <strong className="kpi-card__value">{faToman(report.registeredIncome)}</strong>
                <span className="kpi-card__caption">{faNum(report.incomeCount)} رکورد — مشاهدهٔ گزارش</span>
              </button>
              <button
                type="button"
                className="kpi-card kpi-card--expense kpi-card--link"
                onClick={() => navigate("/reports/income-expense")}
              >
                <span className="kpi-card__label">هزینهٔ ثبت‌شده</span>
                <strong className="kpi-card__value">{faToman(report.registeredExpense)}</strong>
                <span className="kpi-card__caption">{faNum(report.expenseCount)} رکورد — مشاهدهٔ گزارش</span>
              </button>
              <div
                className={cn(
                  "kpi-card",
                  report.registeredNet >= 0 ? "kpi-card--income" : "kpi-card--expense"
                )}
              >
                <span className="kpi-card__label">سود/زیان خالص ثبت‌شده</span>
                <strong className="kpi-card__value">{faToman(report.registeredNet)}</strong>
                <span className="kpi-card__caption">درآمد منهای هزینه</span>
              </div>
            </div>
          </section>

          {/* نمای فروش/خرید */}
          <section className="page__section" aria-label="فروش و خرید">
            <div className="section-head">
              <h2>فروش و خرید فاکتورها</h2>
            </div>
            <div className="kpi-grid">
              <button
                type="button"
                className="kpi-card kpi-card--link"
                onClick={() => navigate("/reports/sales")}
              >
                <span className="kpi-card__label">فروش</span>
                <strong className="kpi-card__value">{faTomanCompact(report.salesTotal)}</strong>
                <span className="kpi-card__caption">{faNum(report.salesCount)} فاکتور — مشاهدهٔ گزارش</span>
              </button>
              <button
                type="button"
                className="kpi-card kpi-card--link"
                onClick={() => navigate("/reports/purchases")}
              >
                <span className="kpi-card__label">خرید</span>
                <strong className="kpi-card__value">{faTomanCompact(report.purchaseTotal)}</strong>
                <span className="kpi-card__caption">{faNum(report.purchaseCount)} فاکتور — مشاهدهٔ گزارش</span>
              </button>
              <div
                className={cn(
                  "kpi-card",
                  report.tradeMargin >= 0 ? "kpi-card--income" : "kpi-card--expense"
                )}
              >
                <span className="kpi-card__label">شاخص فروش منهای خرید</span>
                <strong className="kpi-card__value">{faTomanCompact(report.tradeMargin)}</strong>
                <span className="kpi-card__caption">شاخص مشتق‌شده — معیار حسابداری رسمی نیست</span>
              </div>
            </div>
          </section>

          {/* یادداشت شفافیت */}
          <section className="page__section" aria-label="یادداشت تعارییف">
            <Alert
              variant="info"
              title="تعریف شفاف اعداد"
              description={
                <>
                  «درآمد» و «هزینه» فقط رکوردهای ماژول هزینه‌ها و درآمدها هستند؛ «فروش»
                  جمع فاکتورهای فروش و «خرید» جمع فاکتورهای خرید است. فروش به‌طور خودکار
                  درآمد و خرید به‌طور خودکار هزینه تلقی نمی‌شود؛ به همین دلیل خالص
                  ثبت‌شده و شاخص فروش−خرید جدا از هم نمایش داده می‌شوند.
                </>
              }
            />
          </section>
        </>
      )}
    </ReportLayout>
  );
}
