import type {
  Invoice,
  InvoiceStatus,
  InvoiceType,
  PaymentType,
  ShippingStatus,
} from "./types";
import { faNum, faToman, toFaDigits, toEnDigits } from "@/lib/fa";
import {
  faDateLong,
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

/**
 * ساخت شمارهٔ بعدی فاکتور از روی تنظیمات شماره‌گذاری (فاز ۷).
 *
 * قانون‌ها:
 * - شمارهٔ فاکتورهای موجود هرگز تغییر نمی‌کند.
 * - شمارهٔ جدید از «شمارهٔ بعدی» تنظیمات شروع می‌شود، اما اگر فاکتوری
 *   با همین پیشوند و شمارهٔ بزرگ‌تر وجود داشته باشد، از آن جلو می‌زند
 *   تا شمارهٔ تکراری ساخته نشود (قطعی و بدون برخورد).
 */
export function nextInvoiceNumberFor(
  numbering: { prefix: string; nextNumber: number },
  existingNumbers: string[]
): string {
  const prefix = numbering.prefix.trim() || "INV";
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escaped}-(\\d+)$`);
  let max = 0;
  for (const num of existingNumbers) {
    const m = num.match(pattern);
    if (m) max = Math.max(max, Number(m[1]));
  }
  const next = Math.max(Math.max(1, Math.floor(numbering.nextNumber)), max + 1);
  return `${prefix}-${next}`;
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
export function buildShareText(
  inv: Invoice,
  partyName: string,
  businessName?: string
): string {
  const lines: string[] = [];
  if (businessName?.trim()) lines.push(businessName.trim());
  lines.push(
    `فاکتور ${INVOICE_TYPE_LABEL[inv.type]} ${inv.invoiceNumber}`,
    `طرف حساب: ${partyName}`,
    `تاریخ: ${faDateLong(inv.date)} — ساعت: ${toFaDigits(inv.time)}`,
    "",
    "اقلام:"
  );
  for (const item of inv.items) {
    lines.push(
      `• ${item.nameSnapshot} × ${faNum(item.quantity)}${item.unit ? ` ${item.unit}` : ""} — ${faToman(item.total)}`
    );
  }
  lines.push("", `مبلغ کل: ${faToman(inv.totalAmount)}`);
  return lines.join("\n");
}
