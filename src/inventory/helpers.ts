import type { Product, StockMovement } from "./types";
import { getFormatConfig } from "@/settings/formatConfig";

/** وضعیت موجودی کالا — برای نشان‌ها و فیلترها */
export type StockStatus = "in" | "low" | "out";

/**
 * وضعیت موجودی با احترام به تنظیمات (فاز ۷):
 * وقتی «هشدار کم‌بودن موجودی» در تنظیمات غیرفعال باشد، وضعیت «رو به اتمام»
 * گزارش نمی‌شود — اما «ناموجود» همیشه نمایش داده می‌شود.
 */
export function getStockStatus(product: Product): StockStatus {
  const stock = product.currentStock ?? 0;
  if (stock <= 0) return "out";
  if (
    getFormatConfig().lowStockWarning &&
    product.reorderPoint !== undefined &&
    stock <= product.reorderPoint
  ) {
    return "low";
  }
  return "in";
}

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  in: "موجود",
  low: "رو به اتمام",
  out: "ناموجود",
};

/** قیمت نمایشی یک قلم — فروش برای کالا، فی برای خدمت */
export function itemPrice(item: Product): number {
  return item.type === "PRODUCT"
    ? item.salePrice ?? 0
    : item.servicePrice ?? 0;
}

export interface StockTotals {
  totalEntry: number;
  totalExit: number;
}

/** مجموع ورود و خروج یک کالا از روی حرکات انبار */
export function computeStockTotals(
  movements: StockMovement[]
): StockTotals {
  let totalEntry = 0;
  let totalExit = 0;
  for (const m of movements) {
    if (m.type === "ENTRY") totalEntry += m.quantity;
    else totalExit += m.quantity;
  }
  return { totalEntry, totalExit };
}

export const TYPE_LABEL = {
  PRODUCT: "کالا",
  SERVICE: "خدمت",
} as const;
