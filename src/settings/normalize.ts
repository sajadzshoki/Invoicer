/**
 * نرمال‌سازی و مهاجرت تنظیمات (فاز ۷)
 *
 * مهاجرت سبک: هر ورودی ناشناخته با پیش‌فرض‌ها ادغام می‌شود؛ فقط مقدارهای
 * معتبر حفظ می‌شوند و ساختارهای قدیمی‌تر هرگز پاک نمی‌شوند — جای خالی هر
 * فیلد با پیش‌فرض پر می‌شود.
 */

import { DEFAULT_SETTINGS } from "./defaults";
import type {
  AppSettings,
  BusinessSettings,
  ChequeSettings,
  FinancialSettings,
  InventorySettings,
  InvoiceSettings,
  PaymentMethodsSettings,
  TaxSettings,
  TypeNumbering,
} from "./types";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** بیرون کشیدن مقدار رشته‌ای امن؛ برای ورودی‌های نامعتبر رشتهٔ خالی */
function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function numbering(value: unknown, fallback: TypeNumbering): TypeNumbering {
  if (!isObject(value)) return { ...fallback };
  const prefix = str(value.prefix) || fallback.prefix;
  const nextNumber = Math.max(1, Math.floor(num(value.nextNumber, fallback.nextNumber)));
  return { prefix, nextNumber };
}

function normalizeBusiness(value: unknown): BusinessSettings {
  const d = DEFAULT_SETTINGS.business;
  if (!isObject(value)) return { ...d };
  const logo = typeof value.logo === "string" && value.logo ? value.logo : undefined;
  return {
    name: str(value.name),
    ownerName: str(value.ownerName),
    phone: str(value.phone),
    mobile: str(value.mobile),
    email: str(value.email),
    address: str(value.address),
    postalCode: str(value.postalCode),
    economicCode: str(value.economicCode),
    description: str(value.description),
    logo,
  };
}

function normalizeInvoice(value: unknown): InvoiceSettings {
  const d = DEFAULT_SETTINGS.invoice;
  if (!isObject(value)) return structuredClone(d);
  const numberingValue = isObject(value.numbering) ? value.numbering : {};
  const defaultsValue = isObject(value.defaults) ? value.defaults : {};
  const appearanceValue = isObject(value.appearance) ? value.appearance : {};

  const type =
    defaultsValue.type === "SELL" || defaultsValue.type === "BUY" || defaultsValue.type === "DRAFT"
      ? defaultsValue.type
      : d.defaults.type;
  const paymentType =
    defaultsValue.paymentType === "CASH" ||
    defaultsValue.paymentType === "CREDIT" ||
    defaultsValue.paymentType === "INSTALLMENT" ||
    defaultsValue.paymentType === "CHEQUE"
      ? defaultsValue.paymentType
      : d.defaults.paymentType;

  const layout =
    appearanceValue.layout === "formal" ? "formal" : appearanceValue.layout === "simple" ? "simple" : d.appearance.layout;

  return {
    numbering: {
      SELL: numbering(numberingValue.SELL, d.numbering.SELL),
      BUY: numbering(numberingValue.BUY, d.numbering.BUY),
      DRAFT: numbering(numberingValue.DRAFT, d.numbering.DRAFT),
    },
    defaults: {
      type,
      paymentType,
      description: str(defaultsValue.description),
    },
    appearance: {
      layout,
      showLogo: bool(appearanceValue.showLogo, d.appearance.showLogo),
      showBusinessAddress: bool(appearanceValue.showBusinessAddress, d.appearance.showBusinessAddress),
      showBusinessPhone: bool(appearanceValue.showBusinessPhone, d.appearance.showBusinessPhone),
      showCustomerAddress: bool(appearanceValue.showCustomerAddress, d.appearance.showCustomerAddress),
      showNotes: bool(appearanceValue.showNotes, d.appearance.showNotes),
      showPaymentInfo: bool(appearanceValue.showPaymentInfo, d.appearance.showPaymentInfo),
      showFooter: bool(appearanceValue.showFooter, d.appearance.showFooter),
      footerText: str(appearanceValue.footerText) || d.appearance.footerText,
    },
  };
}

function normalizeTax(value: unknown): TaxSettings {
  const d = DEFAULT_SETTINGS.tax;
  if (!isObject(value)) return { ...d };
  const rate = Math.min(100, Math.max(0, num(value.rate, d.rate)));
  return { enabled: bool(value.enabled, d.enabled), rate };
}

function normalizeFinancial(value: unknown): FinancialSettings {
  const d = DEFAULT_SETTINGS.financial;
  if (!isObject(value)) return { ...d };
  return {
    currency: value.currency === "RIAL" ? "RIAL" : "TOMAN",
    digits: value.digits === "en" ? "en" : "fa",
    dateSystem: value.dateSystem === "gregorian" ? "gregorian" : "jalali",
    thousandSeparator: bool(value.thousandSeparator, d.thousandSeparator),
  };
}

function normalizePayments(value: unknown): PaymentMethodsSettings {
  const d = DEFAULT_SETTINGS.payments;
  if (!isObject(value)) return { ...d };
  return {
    CASH: bool(value.CASH, d.CASH),
    CREDIT: bool(value.CREDIT, d.CREDIT),
    INSTALLMENT: bool(value.INSTALLMENT, d.INSTALLMENT),
    CHEQUE: bool(value.CHEQUE, d.CHEQUE),
  };
}

function normalizeInventory(value: unknown): InventorySettings {
  const d = DEFAULT_SETTINGS.inventory;
  if (!isObject(value)) return { ...d };
  const reorder =
    typeof value.defaultReorderPoint === "number" &&
    Number.isFinite(value.defaultReorderPoint) &&
    value.defaultReorderPoint >= 0
      ? value.defaultReorderPoint
      : undefined;
  return {
    defaultUnit: str(value.defaultUnit),
    defaultReorderPoint: reorder,
    lowStockWarning: bool(value.lowStockWarning, d.lowStockWarning),
  };
}

function normalizeCheque(value: unknown): ChequeSettings {
  const d = DEFAULT_SETTINGS.cheque;
  if (!isObject(value)) return { ...d };
  return {
    defaultBank: str(value.defaultBank),
    reminderEnabled: bool(value.reminderEnabled, d.reminderEnabled),
    reminderDaysBefore: Math.min(30, Math.max(0, Math.floor(num(value.reminderDaysBefore, d.reminderDaysBefore)))),
  };
}

/**
 * نرمال‌سازی ساختار خام ذخیره‌شده به تنظیمات معتبر.
 * هر فیلد گم‌شده با پیش‌فرض پر می‌شود؛ فیلدهای ناشناخته نادیده گرفته
 * می‌شوند و هرگز خطایی پرتاب نمی‌شود.
 */
export function normalizeSettings(raw: unknown): AppSettings {
  const base = structuredClone(DEFAULT_SETTINGS);
  if (!isObject(raw)) return base;
  return {
    version: 1,
    business: normalizeBusiness(raw.business),
    invoice: normalizeInvoice(raw.invoice),
    tax: normalizeTax(raw.tax),
    financial: normalizeFinancial(raw.financial),
    payments: normalizePayments(raw.payments),
    inventory: normalizeInventory(raw.inventory),
    cheque: normalizeCheque(raw.cheque),
    language: "fa",
  };
}
