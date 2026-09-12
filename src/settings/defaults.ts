/**
 * مقدارهای پیش‌فرض تنظیمات (فاز ۷)
 * پیش‌فرض‌ها دقیقاً رفتار فعلی اپ را بازتولید می‌کنند تا با نصب تازه،
 * هیچ تغییر محسوسی رخ ندهد.
 */

import type { AppSettings } from "./types";

export const SETTINGS_STORAGE_KEY = "nasagh:settings:v1";
export const SETTINGS_VERSION = 1;

/** نسخهٔ نمایشی برنامه — در «دربارهٔ نسق» نمایش داده می‌شود */
export const APP_VERSION = "0.7.0";
export const APP_PHASE = "فاز ۷";

export const DEFAULT_SETTINGS: AppSettings = {
  version: SETTINGS_VERSION,
  business: {
    name: "",
    ownerName: "",
    phone: "",
    mobile: "",
    email: "",
    address: "",
    postalCode: "",
    economicCode: "",
    description: "",
  },
  invoice: {
    numbering: {
      SELL: { prefix: "INV", nextNumber: 1009 },
      BUY: { prefix: "INV", nextNumber: 1009 },
      DRAFT: { prefix: "INV", nextNumber: 1009 },
    },
    defaults: {
      type: "SELL",
      paymentType: "CASH",
      description: "",
    },
    appearance: {
      layout: "simple",
      showLogo: true,
      showBusinessAddress: true,
      showBusinessPhone: true,
      showCustomerAddress: true,
      showNotes: true,
      showPaymentInfo: true,
      showFooter: true,
      footerText: "از خرید شما متشکریم.",
    },
  },
  tax: {
    enabled: false,
    rate: 9,
  },
  financial: {
    currency: "TOMAN",
    digits: "fa",
    dateSystem: "jalali",
    thousandSeparator: true,
  },
  payments: {
    CASH: true,
    CREDIT: true,
    INSTALLMENT: true,
    CHEQUE: true,
  },
  inventory: {
    defaultUnit: "",
    lowStockWarning: true,
  },
  cheque: {
    defaultBank: "",
    reminderEnabled: true,
    reminderDaysBefore: 0,
  },
  language: "fa",
};
