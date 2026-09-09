/**
 * مدل دادهٔ ماژول کالاها و خدمات (فاز ۳)
 *
 * مرزهای حسابداری — بسیار مهم:
 * این ماژول فقط «موجودی» را مدیریت می‌کند. حرکات انبار (ورود/خروج)
 * هیچ اثری بر حساب طرف حساب، طلب/بدهی یا درآمد/هزینه ندارند.
 * فاکتورهای واقعی خرید/فروش در فاز ۵ روی همین ساختار سوار می‌شوند.
 */

export type ItemType = "PRODUCT" | "SERVICE";

export interface Product {
  id: string;
  type: ItemType;
  name: string;
  description?: string;
  /** تصویر به‌صورت dataURL (ذخیرهٔ محلی) */
  image?: string;
  categoryId?: string;
  showInOnlinePriceList: boolean;
  createdAt: string;
  updatedAt: string;

  /* ---------- فیلدهای اختصاصی کالا ---------- */
  barcode?: string;
  unit?: string;
  initialStock?: number;
  currentStock?: number;
  purchasePrice?: number;
  salePrice?: number;
  reorderPoint?: number;
  minimumOrderQuantity?: number;

  /* ---------- فیلد اختصاصی خدمت ---------- */
  servicePrice?: number;
}

export type MovementType = "ENTRY" | "EXIT";

/**
 * حرکت انبار — فقط موجودی کالا را تغییر می‌دهد.
 *
 * منابع حرکت:
 * - INITIAL: موجودی اولیه هنگام ساخت کالا
 * - MANUAL: ورود/خروج دستی (هیچ اثر مالی ندارد)
 * - INVOICE: متصل به فاکتور فروش (خروج) یا فاکتور خرید (ورود) — فاز ۴
 *
 * نکتهٔ مهم: حرکات دستی ورود/خروج همچنان از فاکتور جدا هستند و
 * هیچ اثر مالی ندارند؛ فقط حرکات با منبع INVOICE به فاکتور متصل‌اند.
 */
export interface StockMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  unit?: string;
  /** تاریخ ISO میلادی (نمایش جلالی) */
  date: string;
  description?: string;
  source: "INITIAL" | "MANUAL" | "INVOICE";
  /** شناسهٔ فاکتور سازنده — برای ردیابی و بازگشت اثر فاکتور */
  invoiceId?: string;
  createdAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
