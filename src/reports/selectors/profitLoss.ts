import type { ReportRange } from "@/reports/dateRange/range";
import { getSalesReport, getPurchaseReport } from "./trade";
import { getIncomeExpenseReport } from "./incomeExpense";
import type { ReportDataSource } from "./dataSource";

/**
 * سلکتور سود و زیان (فاز ۶)
 *
 * هیچ قانون حسابداری تازه‌ای اختراع نمی‌شود؛ فقط دو نمای شفاف:
 * ۱) درآمدها و هزینه‌های ثبت‌شده (registerCost) و خالص آن‌ها
 * ۲) فروش و خرید فاکتورها به‌صورت جدا، با یک شاخص مشتقِ برچسب‌خورده
 *
 * فروش ≠ درآمد و خرید ≠ هزینه؛ این دو هرگز در هم ادغام نمی‌شوند.
 */

export interface ProfitLossReport {
  /** درآمدهای ثبت‌شده (registerCost) */
  registeredIncome: number;
  /** هزینه‌های ثبت‌شده (registerCost) */
  registeredExpense: number;
  /** خالص ثبت‌شده = درآمد − هزینه */
  registeredNet: number;
  incomeCount: number;
  expenseCount: number;

  /** فروش قطعی بازه */
  salesTotal: number;
  salesCount: number;
  /** خرید قطعی بازه */
  purchaseTotal: number;
  purchaseCount: number;
  /** شاخص مشتق‌شدهٔ فروش − خرید؛ معیار حسابداری رسمی نیست */
  tradeMargin: number;
}

export function getProfitLossReport(
  data: ReportDataSource,
  range: ReportRange
): ProfitLossReport {
  const incomeExpense = getIncomeExpenseReport(data, range);
  const sales = getSalesReport(data, range);
  const purchases = getPurchaseReport(data, range);

  return {
    registeredIncome: incomeExpense.incomeTotal,
    registeredExpense: incomeExpense.expenseTotal,
    registeredNet: incomeExpense.net,
    incomeCount: incomeExpense.incomeCount,
    expenseCount: incomeExpense.expenseCount,
    salesTotal: sales.total,
    salesCount: sales.count,
    purchaseTotal: purchases.total,
    purchaseCount: purchases.count,
    tradeMargin: sales.total - purchases.total,
  };
}
