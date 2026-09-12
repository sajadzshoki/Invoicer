import { todayIso } from "@/lib/jalali";
import type { ReportRange } from "@/reports/dateRange/range";
import { getSalesReport, getPurchaseReport } from "./trade";
import { getIncomeExpenseReport } from "./incomeExpense";
import { getReceivablesReport } from "./receivables";
import type { ReportDataSource } from "./dataSource";

/**
 * سلکتور خلاصهٔ داشبورد گزارش‌ها (فاز ۶)
 *
 * منبع مشترک صفحهٔ گزارش‌ها و داشبورد خانه — تا منطق محاسبه تکرار نشود.
 * فروش، خرید، درآمد و هزینه مفاهیم جدا هستند و هرگز در هم ادغام نمی‌شوند.
 */

export interface DashboardSummary {
  /** فروش قطعی بازه */
  sales: number;
  salesCount: number;
  /** خرید قطعی بازه */
  purchases: number;
  purchasesCount: number;
  /** درآمد ثبت‌شده (registerCost) در بازه */
  income: number;
  incomeCount: number;
  /** هزینهٔ ثبت‌شده (registerCost) در بازه */
  expense: number;
  expenseCount: number;
  /** خالص ثبت‌شده = درآمد − هزینه */
  registeredNet: number;
  /** مجموع طلب — ماندهٔ لحظه‌ای، بدون محدودیت بازه */
  receivables: number;
  /** مجموع بدهی — ماندهٔ لحظه‌ای، بدون محدودیت بازه */
  payables: number;
  /** چک‌های در انتظار وصول با سررسید از امروز به بعد */
  upcomingChequeCount: number;
  upcomingChequeAmount: number;
}

export function getDashboardSummary(
  data: ReportDataSource,
  range: ReportRange
): DashboardSummary {
  const sales = getSalesReport(data, range);
  const purchases = getPurchaseReport(data, range);
  const incomeExpense = getIncomeExpenseReport(data, range);
  const receivables = getReceivablesReport(data);

  const today = todayIso();
  const upcoming = data.cheques.filter(
    (c) => c.status === "PENDING" && c.dueDate >= today
  );

  return {
    sales: sales.total,
    salesCount: sales.count,
    purchases: purchases.total,
    purchasesCount: purchases.count,
    income: incomeExpense.incomeTotal,
    incomeCount: incomeExpense.incomeCount,
    expense: incomeExpense.expenseTotal,
    expenseCount: incomeExpense.expenseCount,
    registeredNet: incomeExpense.net,
    receivables: receivables.receivableTotal,
    payables: receivables.payableTotal,
    upcomingChequeCount: upcoming.length,
    upcomingChequeAmount: upcoming.reduce((s, c) => s + c.amount, 0),
  };
}
