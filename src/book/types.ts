/**
 * مدل دادهٔ ماژول طرف حساب‌ها (دفتر حساب)
 *
 * نکتهٔ معماری: تراکنش‌های «حساب طرف حساب» (دریافت/پرداخت پول با شخص)
 * مفهوم جداگانه‌ای از «هزینه‌ها و درآمدهای» کسب‌وکار هستند و در فازهای
 * بعدی هم هرگز با هم ادغام نمی‌شوند. فاکتورها و چک‌ها نیز مدل‌های مستقل
 * خود را خواهند داشت؛ این تایپ‌ها فقط برای نمایش تاریخچه آماده‌اند.
 */

export interface Person {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  /** تاریخ تولد به‌صورت ISO میلادی (نمایش جلالی) */
  birthDate?: string;
  avatar?: string;
  createdAt: string;
}

/** انواع تراکنش دفتر حساب — در فاز ۲ فقط دریافت و پرداخت کاربردی هستند */
export type BookAccountTransactionType =
  | "RECEIVED" // پول گرفتم — دریافت از طرف حساب
  | "PAID" // پول دادم — پرداخت به طرف حساب
  | "SALE_INVOICE" // فاکتور فروش — فاز بعد
  | "PURCHASE_INVOICE" // فاکتور خرید — فاز بعد
  | "CHEQUE"; // چک — فاز بعد

export interface BookAccountTransaction {
  id: string;
  personId: string;
  type: BookAccountTransactionType;
  /** مبلغ به تومان */
  amount: number;
  /** تاریخ به‌صورت ISO میلادی */
  date: string;
  description?: string;
  /**
   * شناسهٔ فاکتور سازندهٔ این رکورد (فاز ۴).
   * رکوردهای متصل به فاکتور با این شناسه قابل ردیابی/بازگشت هستند تا
   * هنگام ویرایش یا حذف فاکتور، اثر مالی دو بار اعمال نشود.
   */
  invoiceId?: string;
  /**
   * شناسهٔ چک سازندهٔ این رکورد (فاز ۵).
   * اثر مالی چک فقط از مسیر همین رکوردها اعمال/بازگشت داده می‌شود تا
   * هرگز یک چک دو بار شمرده نشود.
   */
  chequeId?: string;
  createdAt: string;
}

export interface PartyNote {
  id: string;
  personId: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PartyReminder {
  id: string;
  personId: string;
  title: string;
  /** تاریخ ISO میلادی */
  date: string;
  /** ساعت به‌صورت «ساعت:دقیقه» */
  time: string;
  description?: string;
  createdAt: string;
}

/** وضعیت مالی طرف حساب نسبت به ما */
export type PartyStatus = "debtor" | "creditor" | "settled";

/** تماس مخاطب (برای افزودن از مخاطبین) */
export interface DeviceContact {
  id: string;
  name: string;
  phone: string;
}
