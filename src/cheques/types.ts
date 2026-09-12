/**
 * مدل دادهٔ ماژول چک‌ها (فاز ۵)
 *
 * مرزهای حسابداری — بسیار مهم:
 * - چک متصل به فاکتور (sourceType = INVOICE) فقط از مسیر همان فاکتور اثر
 *   مالی دارد؛ هرگز هم‌زمان رکورد مستقل دفتر حساب ساخته نمی‌شود.
 * - چک متصل به دفتر حساب (sourceType = BOOKACCOUNT) فقط در وضعیت
 *   «وصول شده» و وقتی «خرج چک» نباشد اثر مالی دارد.
 * - هزینه‌ها و درآمدها (registerCost) موجودیت کاملاً جداگانه‌ای هستند و
 *   به چک/فاکتور/طرف حساب متصل نمی‌شوند.
 */

/** نوع چک — چیستی چک */
export type ChequeType =
  | "RECEIVED" // دریافتی — از طرف حساب گرفته‌ایم
  | "PAID" // پرداختی — به طرف حساب داده‌ایم
  | "TRANSFERRED"; // خرج چک — چک دریافتی را به شخص دیگری واگذار کرده‌ایم

/** وضعیت چک — چه اتفاقی برایش افتاده است */
export type ChequeStatus =
  | "PENDING" // در انتظار وصول
  | "RECEIVED" // وصول شده — تنها وضعیت با اثر تسویه
  | "RETURNED" // برگشت خورده
  | "CANCELLED"; // باطل شده

/** منبع مالی چک — یک چک دقیقاً یک منبع دارد */
export type ChequeSourceType = "INVOICE" | "BOOKACCOUNT";

export interface ChequeAttachment {
  name: string;
  /** تصویر به‌صورت dataURL (ذخیرهٔ محلی)؛ برای فایل غیرتصویری خالی است */
  dataUrl?: string;
  kind: "image" | "file";
  size?: number;
}

export interface Cheque {
  id: string;
  /** فاکتور مرتبط — فقط برای منبع فاکتور */
  invoiceId?: string;
  /** طرف حساب مرتبط — برای منبع دفتر حساب یا نمایش فاکتور */
  personId?: string;
  sourceType: ChequeSourceType;
  type: ChequeType;
  status: ChequeStatus;
  /** مبلغ به تومان */
  amount: number;
  /** تاریخ سررسید به‌صورت ISO میلادی */
  dueDate: string;
  sayadiNumber?: string;
  bank?: string;
  description?: string;
  attachment?: ChequeAttachment;
  reminderId?: string;
  createdAt: string;
  updatedAt: string;
}

/** یادآور محلی سررسید چک — بدون پوش نوتیفیکیشن */
export interface ChequeReminder {
  id: string;
  chequeId: string;
  title: string;
  date: string;
  description?: string;
  createdAt: string;
}
