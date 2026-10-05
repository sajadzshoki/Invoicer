import type {
  BookAccountTransaction,
  PartyStatus,
} from "./types";

/**
 * منطق مالی سادهٔ دفتر حسابِ شخص
 *
 * قرارداد مانده (از دید ما):
 * - مثبت  → طرف حساب «بدهکار» است (از او طلب داریم)
 * - منفی  → طرف حساب «بستانکار» است (به او بدهکاریم)
 * - صفر   → «تسویه‌شده»
 *
 * پول گرفتم (دریافت از شخص) مانده را کم می‌کند و
 * پول دادم (پرداخت به شخص) مانده را زیاد می‌کند.
 * فاکتور فروش مانده را زیاد و فاکتور خرید مانده را کم می‌کند.
 * نوع CHEQUE اثر مستقیم ندارد؛ اثر چک فقط از رکوردهای تگ‌دار chequeId می‌آید.
 */

export function transactionEffect(t: BookAccountTransaction): number {
  switch (t.type) {
    case "RECEIVED":
      return -t.amount;
    case "PAID":
      return t.amount;
    case "SALE_INVOICE":
      return t.amount;
    case "PURCHASE_INVOICE":
      return -t.amount;
    case "CHEQUE":
      // اثر مالی چک از رکوردهای SALE/PURCHASE و RECEIVED/PAID با تگ chequeId می‌آید
      return 0;
  }
}

export interface PartyFinanceSummary {
  /** ماندهٔ حساب؛ مثبت یعنی بدهکارِ ما */
  balance: number;
  status: PartyStatus;
  /** طلب ما از طرف حساب (اگر مانده مثبت باشد) */
  receivable: number;
  /** بدهی ما به طرف حساب (اگر مانده منفی باشد) */
  payable: number;
  totalReceived: number;
  totalPaid: number;
  totalSales: number;
  totalPurchases: number;
  /** سود ناخالصِ معامله با این شخص: فروش − خرید */
  profit: number;
  lastTransaction?: BookAccountTransaction;
}

export function computePartySummary(
  transactions: BookAccountTransaction[]
): PartyFinanceSummary {
  let totalReceived = 0;
  let totalPaid = 0;
  let totalSales = 0;
  let totalPurchases = 0;
  let lastTransaction: BookAccountTransaction | undefined;

  for (const t of transactions) {
    switch (t.type) {
      case "RECEIVED":
        totalReceived += t.amount;
        break;
      case "PAID":
        totalPaid += t.amount;
        break;
      case "SALE_INVOICE":
        totalSales += t.amount;
        break;
      case "PURCHASE_INVOICE":
        totalPurchases += t.amount;
        break;
      case "CHEQUE":
        break;
    }
    if (!lastTransaction || t.date > lastTransaction.date) {
      lastTransaction = t;
    }
  }

  const balance = totalPaid + totalSales - totalReceived - totalPurchases;
  const status: PartyStatus =
    balance > 0 ? "debtor" : balance < 0 ? "creditor" : "settled";

  return {
    balance,
    status,
    receivable: balance > 0 ? balance : 0,
    payable: balance < 0 ? -balance : 0,
    totalReceived,
    totalPaid,
    totalSales,
    totalPurchases,
    profit: totalSales - totalPurchases,
    lastTransaction,
  };
}

/** برچسب فارسی وضعیت */
export const STATUS_LABEL: Record<PartyStatus, string> = {
  debtor: "بدهکار",
  creditor: "بستانکار",
  settled: "تسویه‌شده",
};

/** برچسب فارسی نوع تراکنش */
export const TRANSACTION_TYPE_LABEL: Record<
  BookAccountTransaction["type"],
  string
> = {
  RECEIVED: "پول گرفتم",
  PAID: "پول دادم",
  SALE_INVOICE: "فاکتور فروش",
  PURCHASE_INVOICE: "فاکتور خرید",
  CHEQUE: "چک",
};
