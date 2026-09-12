/**
 * مدل تنظیمات نسق (فاز ۷)
 *
 * مرزهای مهم:
 * - تنظیمات هرگز حاوی تراکنش مالی، فاکتور یا رکورد حسابداری نیست.
 * - تنظیمات فقط «نمایش و پیش‌فرض‌ها» را کنترل می‌کنند؛ مقادیر ذخیره‌شدهٔ
 *   مالی را هرگز به‌صورت پنهان تبدیل یا بازنویسی نمی‌کنند.
 * - ساختار نسخه‌بندی‌شده است تا مهاجرت سبک در نسخه‌های بعد ممکن باشد.
 */

import type { InvoiceType, PaymentType } from "@/invoices/types";

/** واحد نمایش مبالغ — مقادیر ذخیره‌شده همیشه به تومان هستند */
export type CurrencyUnit = "TOMAN" | "RIAL";

/** شیوهٔ نمایش ارقام */
export type DigitStyle = "fa" | "en";

/** نظام نمایش تاریخ؛ ذخیرهٔ تاریخ‌ها همیشه ISO میلادی است */
export type DateSystem = "jalali" | "gregorian";

/** چیدمان چاپ فاکتور */
export type InvoiceLayout = "simple" | "formal";

/** تنظیمات شماره‌گذاری یک نوع فاکتور */
export interface TypeNumbering {
  /** پیشوند شماره؛ مثل INV */
  prefix: string;
  /** شمارهٔ بعدی پیشنهادی — شمارهٔ واقعی هرگز از فاکتورهای موجود عقب نمی‌افتد */
  nextNumber: number;
}

export interface BusinessSettings {
  name: string;
  ownerName: string;
  phone: string;
  mobile: string;
  email: string;
  address: string;
  postalCode: string;
  /** شناسه/کد اقتصادی در صورت وجود */
  economicCode: string;
  description: string;
  /** لوگو به‌صورت dataURL — فقط روی همین دستگاه ذخیره می‌شود */
  logo?: string;
}

export interface InvoiceSettings {
  numbering: {
    SELL: TypeNumbering;
    BUY: TypeNumbering;
    DRAFT: TypeNumbering;
  };
  defaults: {
    /** نوع پیش‌فرض فاکتور جدید */
    type: InvoiceType;
    /** روش تسویهٔ پیش‌فرض فاکتور جدید */
    paymentType: PaymentType;
    /** توضیح پیش‌فرض فاکتور جدید */
    description: string;
  };
  appearance: {
    layout: InvoiceLayout;
    showLogo: boolean;
    showBusinessAddress: boolean;
    showBusinessPhone: boolean;
    showCustomerAddress: boolean;
    showNotes: boolean;
    showPaymentInfo: boolean;
    showFooter: boolean;
    /** متن پانوشت چندسطری فاکتور */
    footerText: string;
  };
}

export interface TaxSettings {
  /** فعال‌بودن مالیات به‌صورت پیش‌فرض برای فاکتورهای جدید */
  enabled: boolean;
  /** نرخ پیش‌فرض درصد — فاکتورهای موجود هرگز بازنویسی نمی‌شوند */
  rate: number;
}

export interface FinancialSettings {
  currency: CurrencyUnit;
  digits: DigitStyle;
  dateSystem: DateSystem;
  /** جداکنندهٔ هزارگان در نمایش مبالغ */
  thousandSeparator: boolean;
}

export interface PaymentMethodsSettings {
  /** روش‌های تسویهٔ فعال برای فاکتورهای جدید — فاکتورهای قدیمی دست‌نخورده می‌مانند */
  CASH: boolean;
  CREDIT: boolean;
  INSTALLMENT: boolean;
  CHEQUE: boolean;
}

export interface InventorySettings {
  /** واحد پیش‌فرض برای کالای جدید */
  defaultUnit: string;
  /** نقطهٔ سفارش مجدد پیش‌فرض برای کالای جدید (خالی = بدون پیش‌فرض) */
  defaultReorderPoint?: number;
  /** فعال/غیرفعال‌بودن هشدار کم‌بودن موجودی */
  lowStockWarning: boolean;
}

export interface ChequeSettings {
  /** بانک پیش‌فرض برای چک جدید */
  defaultBank: string;
  /** ساخت یادآور محلی برای چک‌های جدید */
  reminderEnabled: boolean;
  /** یادآور چند روز قبل از سررسید ثبت شود */
  reminderDaysBefore: number;
}

export type AppLanguage = "fa";

export interface AppSettings {
  version: 1;
  business: BusinessSettings;
  invoice: InvoiceSettings;
  tax: TaxSettings;
  financial: FinancialSettings;
  payments: PaymentMethodsSettings;
  inventory: InventorySettings;
  cheque: ChequeSettings;
  language: AppLanguage;
}
