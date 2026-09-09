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
 * `source` برای فاز ۵ آماده است: «ورود خودکار با فاکتور خرید» یا
 * «خروج خودکار با فاکتور فروش» بعداً به‌جای ثبت دستی می‌نشیند.
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
  createdAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
