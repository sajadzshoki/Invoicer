import { inRange, type ReportRange } from "@/reports/dateRange/range";
import {
  dualTimeSeries,
  sumByLabel,
  type DualTimePoint,
  type LabeledSum,
} from "@/reports/calculations/aggregate";
import type { ReportDataSource } from "./dataSource";

/**
 * سلکتور گزارش درآمد/هزینه (فاز ۶)
 *
 * فقط از رکوردهای «هزینه‌ها و درآمدها» (registerCost) می‌خواند.
 * فروش/خرید فاکتورها هرگز اینجا نمی‌آیند — این دو مفهوم جدا هستند.
 */

export interface IncomeExpenseRow {
  id: string;
  title: string;
  type: "INCOME" | "EXPENSE";
  categoryName: string;
  date: string;
  time: string;
  amount: number;
}

export interface IncomeExpenseReport {
  incomeTotal: number;
  expenseTotal: number;
  net: number;
  incomeCount: number;
  expenseCount: number;
  overTime: DualTimePoint[];
  incomeByCategory: LabeledSum[];
  expenseByCategory: LabeledSum[];
  rows: IncomeExpenseRow[];
}

export function getIncomeExpenseReport(
  data: ReportDataSource,
  range: ReportRange
): IncomeExpenseReport {
  const costs = data.costs.filter((c) => inRange(c.date, range));
  const incomes = costs.filter((c) => c.type === "INCOME");
  const expenses = costs.filter((c) => c.type === "EXPENSE");

  const categoryName = (id: string) =>
    data.costCategories.find((c) => c.id === id)?.name ?? "بدون دسته";

  const incomeTotal = incomes.reduce((s, c) => s + c.amount, 0);
  const expenseTotal = expenses.reduce((s, c) => s + c.amount, 0);

  return {
    incomeTotal,
    expenseTotal,
    net: incomeTotal - expenseTotal,
    incomeCount: incomes.length,
    expenseCount: expenses.length,
    overTime: dualTimeSeries(
      incomes.map((c) => ({ date: c.date, amount: c.amount })),
      expenses.map((c) => ({ date: c.date, amount: c.amount })),
      range
    ),
    incomeByCategory: sumByLabel(
      incomes.map((c) => ({ label: categoryName(c.categoryId), amount: c.amount }))
    ),
    expenseByCategory: sumByLabel(
      expenses.map((c) => ({ label: categoryName(c.categoryId), amount: c.amount }))
    ),
    rows: costs
      .map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type,
        categoryName: categoryName(c.categoryId),
        date: c.date,
        time: c.time,
        amount: c.amount,
      }))
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)),
  };
}
