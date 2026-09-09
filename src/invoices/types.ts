/**
 * مدل دادهٔ ماژول فاکتورها (فاز ۴)
 *
 * مرزهای حسابداری — بسیار مهم:
 * - فاکتور «منبع حقیقت» است؛ ماندهٔ طرف حساب و موجودی انبار از روی
 *   رکوردهای متصل به فاکتور (با شناسهٔ فاکتور) مشتق/بازگشت‌پذیرند تا
 *   هیچ اثری دو بار اعمال نشود.
 * - حرکات دستی ورود/خروج انبار همچنان از فاکتور جدا هستند و اثر مالی ندارند.
 * - پیش‌فاکتور هیچ اثر مالی یا انباری ندارد.
 */

export type InvoiceType = "SELL" | "BUY" | "DRAFT";

export type PaymentType = "CASH" | "CREDIT" | "INSTALLMENT" | "CHEQUE";

export type ShippingStatus = "SENT" | "NOT_SENT";

/** وضعیت مالی مشتق‌شدهٔ فاکتور */
export type InvoiceStatus =
  | "PAID" // پرداخت‌شده (نقدی)
  | "UNPAID" // تسویه‌نشده (نسیه)
  | "PARTIAL" // اقساطی — بخشی پرداخت شده
  | "CHEQUE_PENDING" // در انتظار تسویهٔ چک
  | "DRAFT"; // پیش‌فاکتور

export interface InvoiceItem {
  id: string;
  productId: string;
  productType: "PRODUCT" | "SERVICE";
  /** نام قلم در لحظهٔ ثبت فاکتور — فاکتور به دادهٔ فعلی کالا وابسته نیست */
  nameSnapshot: string;
  imageSnapshot?: string;
  quantity: number;
  unit?: string;
  /** قیمت واحد به تومان — در لحظهٔ ثبت از کالا گرفته و قابل ویرایش است */
  unitPrice: number;
  /** تخفیف خط به تومان */
  discount: number;
  /** جمع خط: تعداد × قیمت واحد − تخفیف خط */
  total: number;
}

export interface InvoiceExtraCost {
  id: string;
  /** عنوان هزینه؛ مثل هزینهٔ حمل */
  title: string;
  amount: number;
}

export interface Invoice {
  id: string;
  /** شمارهٔ یکتا؛ مثل INV-1001 */
  invoiceNumber: string;
  type: InvoiceType;
  personId: string;
  /** تاریخ ISO میلادی (نمایش جلالی) */
  date: string;
  /** ساعت به‌صورت «ساعت:دقیقه» */
  time: string;

  items: InvoiceItem[];
  /** جمع تعداد × قیمت واحد همهٔ اقلام (قبل از هر تخفیفی) */
  grossTotal: number;
  /** مجموع تخفیف خط‌ها */
  itemsDiscount: number;
  /** تخفیف کل فاکتور */
  discount: number;
  /** مبلغ پس از تخفیف‌ها = مشمول مالیات */
  subtotal: number;
  taxEnabled: boolean;
  /** نرخ مالیات بر ارزش افزوده (درصد) */
  taxRate: number;
  taxAmount: number;
  extraCosts: InvoiceExtraCost[];
  /** مبلغ کل نهایی */
  totalAmount: number;

  paymentType: PaymentType;
  /** مبلغ پرداخت‌شده در لحظهٔ ثبت (برای اقساط) */
  paidAmount: number;
  shippingStatus?: ShippingStatus;

  description?: string;
  note?: string;
  signature?: string;
  customerContact?: string;

  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
}
