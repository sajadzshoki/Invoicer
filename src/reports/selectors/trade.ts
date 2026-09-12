import type { Invoice, PaymentType } from "@/invoices/types";
import { inRange, type ReportRange } from "@/reports/dateRange/range";
import {
  average,
  sumByLabel,
  timeSeries,
  type LabeledSum,
  type TimePoint,
} from "@/reports/calculations/aggregate";
import {
  personName,
  productCategoryName,
  type ReportDataSource,
} from "./dataSource";

/**
 * سلکتور گزارش فروش/خرید (فاز ۶)
 *
 * تعریف شفاف:
 * - فروش = جمع مبلغ کل فاکتورهای فروشِ قطعی (بدون پیش‌فاکتور) در بازه
 * - خرید = جمع مبلغ کل فاکتورهای خریدِ قطعی در بازه
 * چک‌ها فقط «تسویه» هستند و هرگز به فروش/خرید اضافه نمی‌شوند.
 */

export interface TradeInvoiceRow {
  id: string;
  invoiceNumber: string;
  partyName: string;
  date: string;
  paymentType: PaymentType;
  totalAmount: number;
  /** ماندهٔ تسویه‌نشده — برای فاکتورهای چکی با درنظرگرفتن چک‌های وصول‌شده */
  outstanding: number;
}

export interface TradeReport {
  total: number;
  count: number;
  averageAmount: number;
  byPaymentType: Record<PaymentType, { amount: number; count: number }>;
  overTime: TimePoint[];
  byCategory: LabeledSum[];
  byItem: LabeledSum[];
  invoices: TradeInvoiceRow[];
}

function tradeReport(
  data: ReportDataSource,
  range: ReportRange,
  type: "SELL" | "BUY"
): TradeReport {
  const invoices = data.invoices.filter(
    (inv) => inv.type === type && inRange(inv.date, range)
  );

  const byPaymentType: TradeReport["byPaymentType"] = {
    CASH: { amount: 0, count: 0 },
    CREDIT: { amount: 0, count: 0 },
    INSTALLMENT: { amount: 0, count: 0 },
    CHEQUE: { amount: 0, count: 0 },
  };

  let total = 0;
  const itemInputs: Array<{ label: string; amount: number }> = [];
  const categoryInputs: Array<{ label: string; amount: number }> = [];

  for (const inv of invoices) {
    total += inv.totalAmount;
    const bucket = byPaymentType[inv.paymentType];
    bucket.amount += inv.totalAmount;
    bucket.count += 1;

    for (const item of inv.items) {
      itemInputs.push({ label: item.nameSnapshot, amount: item.total });
      const product = data.products.find((p) => p.id === item.productId);
      categoryInputs.push({
        label: productCategoryName(data, product?.categoryId),
        amount: item.total,
      });
    }
  }

  const rows: TradeInvoiceRow[] = invoices
    .map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      partyName: personName(data, inv.personId),
      date: inv.date,
      paymentType: inv.paymentType,
      totalAmount: inv.totalAmount,
      outstanding: outstandingOf(data, inv),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    total,
    count: invoices.length,
    averageAmount: average(total, invoices.length),
    byPaymentType,
    overTime: timeSeries(
      invoices.map((inv) => ({ date: inv.date, amount: inv.totalAmount })),
      range
    ),
    byCategory: sumByLabel(categoryInputs),
    byItem: sumByLabel(itemInputs, 10),
    invoices: rows,
  };
}

/** ماندهٔ فاکتور: برای چکی‌ها چک‌های وصول‌شده کسر می‌شود */
function outstandingOf(data: ReportDataSource, inv: Invoice): number {
  switch (inv.paymentType) {
    case "CASH":
      return 0;
    case "CREDIT":
      return inv.totalAmount;
    case "INSTALLMENT":
      return Math.max(0, inv.totalAmount - inv.paidAmount);
    case "CHEQUE":
      return Math.max(0, inv.totalAmount - data.settledByCheques(inv.id));
  }
}

export function getSalesReport(
  data: ReportDataSource,
  range: ReportRange
): TradeReport {
  return tradeReport(data, range, "SELL");
}

export function getPurchaseReport(
  data: ReportDataSource,
  range: ReportRange
): TradeReport {
  return tradeReport(data, range, "BUY");
}
