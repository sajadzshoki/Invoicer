import type { Product } from "@/inventory/types";
import { inRange, type ReportRange } from "@/reports/dateRange/range";
import type { ReportDataSource } from "./dataSource";

/**
 * سلکتور عملکرد کالاها و خدمات (فاز ۶)
 *
 * تعداد و مبالغ از اقلام فاکتورهای قطعی گرفته می‌شود (نه از حرکات انبار؛
 * حرکات انبار فقط موجودی را تغییر می‌دهند و اثر مالی ندارند).
 * خدمات معیار موجودی ندارند.
 */

export interface ProductPerformanceRow {
  product: Product;
  soldQuantity: number;
  soldAmount: number;
  purchasedQuantity: number;
  purchasedAmount: number;
  /** فقط برای کالا */
  currentStock?: number;
}

export type ProductSortKey =
  | "salesAmount"
  | "soldQuantity"
  | "lowestStock"
  | "name";

export const PRODUCT_SORT_LABEL: Record<ProductSortKey, string> = {
  salesAmount: "بیشترین فروش",
  soldQuantity: "بیشترین تعداد فروش",
  lowestStock: "کمترین موجودی",
  name: "حروف الفبا",
};

export function getProductPerformance(
  data: ReportDataSource,
  range: ReportRange,
  sort: ProductSortKey
): ProductPerformanceRow[] {
  const map = new Map<string, ProductPerformanceRow>();

  const ensure = (product: Product): ProductPerformanceRow => {
    let row = map.get(product.id);
    if (!row) {
      row = {
        product,
        soldQuantity: 0,
        soldAmount: 0,
        purchasedQuantity: 0,
        purchasedAmount: 0,
        currentStock:
          product.type === "PRODUCT" ? product.currentStock ?? 0 : undefined,
      };
      map.set(product.id, row);
    }
    return row;
  };

  for (const inv of data.invoices) {
    if (inv.type === "DRAFT" || !inRange(inv.date, range)) continue;
    for (const item of inv.items) {
      const product = data.products.find((p) => p.id === item.productId);
      if (!product) continue;
      const row = ensure(product);
      if (inv.type === "SELL") {
        row.soldQuantity += item.quantity;
        row.soldAmount += item.total;
      } else {
        row.purchasedQuantity += item.quantity;
        row.purchasedAmount += item.total;
      }
    }
  }

  const rows = [...map.values()];
  switch (sort) {
    case "salesAmount":
      rows.sort((a, b) => b.soldAmount - a.soldAmount);
      break;
    case "soldQuantity":
      rows.sort((a, b) => b.soldQuantity - a.soldQuantity);
      break;
    case "lowestStock":
      rows.sort((a, b) => {
        const sa = a.product.type === "PRODUCT" ? a.product.currentStock ?? 0 : Infinity;
        const sb = b.product.type === "PRODUCT" ? b.product.currentStock ?? 0 : Infinity;
        return sa - sb;
      });
      break;
    case "name":
      rows.sort((a, b) => a.product.name.localeCompare(b.product.name, "fa"));
      break;
  }
  return rows;
}
