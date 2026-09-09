import type {
  Invoice,
  InvoiceStatus,
  InvoiceType,
  PaymentType,
  ShippingStatus,
} from "./types";
import { toFaDigits, toEnDigits } from "@/lib/fa";
import {
  isoFromDate,
  jalaliToIso,
  todayJalali,
  todayIso,
} from "@/lib/jalali";

/* ------------------------------ برچسب‌ها ------------------------------ */

export const INVOICE_TYPE_LABEL: Record<InvoiceType, string> = {
  SELL: "فروش",
  BUY: "خرید",
  DRAFT: "پیش‌فاکتور",
};

export const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  CASH: "نقدی",
  CREDIT: "نسیه",
  INSTALLMENT: "اقساط",
  CHEQUE: "چک",
};

export const SHIPPING_LABEL: Record<ShippingStatus, string> = {
  SENT: "ارسال شده",
  NOT_SENT: "ارسال نشده",
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  PAID: "پرداخت‌شده",
  UNPAID: "تسویه‌نشده",
  PARTIAL: "اقساطی",
  CHEQUE_PENDING: "در انتظار تسویه",
  DRAFT: "پیش‌فاکتور",
};

/* ------------------------------ وضعیت و مبالغ مشتق‌شده ------------------------------ */

/**
 * مبلغ باقی‌ماندهٔ فاکتور (مبلغی که هنوز تسویه نشده است).
 * برای چک، تا ثبت نشدن چک در فاز بعد، کل مبلغ «در انتظار تسویه» است.
 */
export function outstandingAmount(inv: Invoice): number {
  if (inv.type === "DRAFT") return 0;
  switch (inv.paymentType) {
    case "CASH":
      return 0;
    case "CREDIT":
      return inv.totalAmount;
    case "INSTALLMENT":
      return Math.max(0, inv.totalAmount - inv.paidAmount);
    case "CHEQUE":
      return inv.totalAmount;
  }
}

/** وضعیت مالی مشتق‌شده از نوع تسویه — منبع حقیقت خود فاکتور است */
export function deriveStatus(inv: {
  type: InvoiceType;
  paymentType: PaymentType;
  paidAmount: number;
}): InvoiceStatus {
  if (inv.type === "DRAFT") return "DRAFT";
  switch (inv.paymentType) {
    case "CASH":
      return "PAID";
    case "CREDIT":
      return "UNPAID";
    case "INSTALLMENT":
      // اقساطی — باقی‌مانده در جزئیات نمایش داده می‌شود
      return "PARTIAL";
    case "CHEQUE":
      return "CHEQUE_PENDING";
  }
}

/* ------------------------------ محاسبهٔ جمع‌ها ------------------------------ */

export interface TotalsInput {
  /** جمع اقلام قبل از تخفیف */
  grossTotal: number;
  /** مجموع تخفیف خط‌ها */
  itemsDiscount: number;
  /** تخفیف کل فاکتور */
  discount: number;
  taxEnabled: boolean;
  taxRate: number;
  extraCostsTotal: number;
}

export interface TotalsResult {
  grossTotal: number;
  itemsDiscount: number;
  discount: number;
  totalDiscount: number;
  subtotal: number;
  taxAmount: number;
  extraCostsTotal: number;
  totalAmount: number;
}

/** محاسبهٔ خالص جمع‌های فاکتور — تابع خالص برای فرم و صفحهٔ جزئیات */
export function computeTotals(input: TotalsInput): TotalsResult {
  const gross = Math.max(0, input.grossTotal);
  const itemsDisc = Math.min(Math.max(0, input.itemsDiscount), gross);
  const disc = Math.min(Math.max(0, input.discount), gross - itemsDisc);
  const subtotal = gross - itemsDisc - disc;
  const taxAmount = input.taxEnabled
    ? Math.round((subtotal * Math.max(0, input.taxRate)) / 100)
    : 0;
  const totalAmount = subtotal + taxAmount + Math.max(0, input.extraCostsTotal);
  return {
    grossTotal: gross,
    itemsDiscount: itemsDisc,
    discount: disc,
    totalDiscount: itemsDisc + disc,
    subtotal,
    taxAmount,
    extraCostsTotal: Math.max(0, input.extraCostsTotal),
    totalAmount,
  };
}

/* ------------------------------ شمارهٔ فاکتور ------------------------------ */

/** نمایش شمارهٔ فاکتور با ارقام فارسی؛ مثل «INV-۱۰۰۱» */
export function faInvoiceNumber(invoiceNumber: string): string {
  const match = invoiceNumber.match(/^(.*?)(\d+)$/);
  if (!match) return invoiceNumber;
  return `${match[1]}${toFaDigits(Number(match[2]))}`;
}

/** ساخت شمارهٔ بعدی از روی شماره‌های موجود */
export function nextInvoiceNumber(existing: string[]): string {
  let max = 1000;
  for (const num of existing) {
    const m = num.match(/(\d+)$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `INV-${max + 1}`;
}

/* ------------------------------ جستجو و فیلتر تاریخ ------------------------------ */

/** نرمال‌سازی متن برای جستجو: تبدیل ارقام فارسی/عربی به لاتین و کوچک‌سازی */
export function normalizeForSearch(value: string): string {
  return toEnDigits(value).toLowerCase().trim();
}

export type DateRangePreset = "today" | "week" | "month" | "custom";

export const DATE_RANGE_LABEL: Record<DateRangePreset, string> = {
  today: "امروز",
  week: "این هفته",
  month: "این ماه",
  custom: "بازه دلخواه",
};

/** شروع هفتهٔ جلالی (شنبه) به‌صورت ISO */
export function startOfWeekIso(): string {
  const d = new Date();
  const daysSinceSaturday = (d.getDay() + 1) % 7;
  d.setDate(d.getDate() - daysSinceSaturday);
  return isoFromDate(d);
}

/** شروع ماه جلالی جاری به‌صورت ISO */
export function startOfJalaliMonthIso(): string {
  const j = todayJalali();
  return jalaliToIso({ jy: j.jy, jm: j.jm, jd: 1 });
}

export interface DateRange {
  from: string;
  to: string;
}

/** بازهٔ تاریخ برای پیش‌تنظیم‌های آماده */
export function presetDateRange(preset: DateRangePreset): DateRange | null {
  switch (preset) {
    case "today":
      return { from: todayIso(), to: todayIso() };
    case "week":
      return { from: startOfWeekIso(), to: todayIso() };
    case "month":
      return { from: startOfJalaliMonthIso(), to: todayIso() };
    default:
      return null;
  }
}

/* ------------------------------ متن اشتراک‌گذاری ------------------------------ */

/** ساخت متن خلاصهٔ فاکتور برای چاپ/اشتراک‌گذاری */
export function buildShareText(inv: Invoice, partyName: string): string {
  const lines: string[] = [
    `فاکتور ${INVOICE_TYPE_LABEL[inv.type]} ${inv.invoiceNumber}`,
    `طرف حساب: ${partyName}`,
    `تاریخ: ${inv.date} — ساعت: ${toFaDigits(inv.time)}`,
    "",
    "اقلام:",
  ];
  for (const item of inv.items) {
    lines.push(
      `• ${item.nameSnapshot} × ${item.quantity}${item.unit ? ` ${item.unit}` : ""} — ${item.total.toLocaleString("fa-IR")} تومان`
    );
  }
  lines.push("", `مبلغ کل: ${inv.totalAmount.toLocaleString("fa-IR")} تومان`);
  return lines.join("\n");
}
