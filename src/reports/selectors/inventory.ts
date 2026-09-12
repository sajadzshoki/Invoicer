import type { Product, StockMovement } from "@/inventory/types";
import { getStockStatus, type StockStatus } from "@/inventory/helpers";
import { inRange, type ReportRange } from "@/reports/dateRange/range";
import type { ReportDataSource } from "./dataSource";

/**
 * سلکتور گزارش موجودی (فاز ۶)
 *
 * ارزش موجودی = موجودی فعلی × قیمت خرید — فقط یک «ارزش تقریبی» برای
 * دید کلی است و هرگز به‌عنوان ارزش‌گذاری حسابداری معرفی نمی‌شود.
 * موجودی فعلی از خود کالا گرفته می‌شود (مخزن فاز ۳)، نه از جمع حرکات.
 */

export interface InventoryProductRow {
  product: Product;
  stock: number;
  unit?: string;
  purchasePrice: number;
  estimatedValue: number;
  status: StockStatus;
}

export interface InventoryReport {
  productCount: number;
  estimatedTotalValue: number;
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
  /** مجموع ورود/خروج حرکات انبار در بازهٔ گزارش */
  entriesInRange: number;
  exitsInRange: number;
  rows: InventoryProductRow[];
}

export function getInventoryReport(
  data: ReportDataSource,
  range: ReportRange
): InventoryReport {
  const products = data.products.filter((p) => p.type === "PRODUCT");

  const rows: InventoryProductRow[] = products.map((product) => {
    const stock = product.currentStock ?? 0;
    const purchasePrice = product.purchasePrice ?? 0;
    return {
      product,
      stock,
      unit: product.unit,
      purchasePrice,
      estimatedValue: stock * purchasePrice,
      status: getStockStatus(product),
    };
  });

  const movementsInRange = data.movements.filter((m) => inRange(m.date, range));

  return {
    productCount: products.length,
    estimatedTotalValue: rows.reduce((s, r) => s + r.estimatedValue, 0),
    lowStockProducts: products.filter((p) => getStockStatus(p) === "low"),
    outOfStockProducts: products.filter((p) => getStockStatus(p) === "out"),
    entriesInRange: movementsInRange
      .filter((m) => m.type === "ENTRY")
      .reduce((s, m) => s + m.quantity, 0),
    exitsInRange: movementsInRange
      .filter((m) => m.type === "EXIT")
      .reduce((s, m) => s + m.quantity, 0),
    rows: rows.sort((a, b) => b.estimatedValue - a.estimatedValue),
  };
}

/* ------------------------------ گردش کالا ------------------------------ */

export type MovementFilter =
  | "all"
  | "entry"
  | "exit"
  | "saleInvoice"
  | "purchaseInvoice"
  | "manualEntry"
  | "manualExit";

export const MOVEMENT_FILTER_LABEL: Record<MovementFilter, string> = {
  all: "همه",
  entry: "ورود",
  exit: "خروج",
  saleInvoice: "فاکتور فروش",
  purchaseInvoice: "فاکتور خرید",
  manualEntry: "ورود دستی",
  manualExit: "خروج دستی",
};

export interface MovementRow {
  movement: StockMovement;
  productName: string;
  sourceLabel: string;
  invoiceId?: string;
  invoiceNumber?: string;
}

/** برچسب منبع حرکت برای نمایش */
export function movementSourceLabel(m: StockMovement): string {
  if (m.source === "INVOICE") {
    return m.type === "EXIT" ? "فاکتور فروش" : "فاکتور خرید";
  }
  if (m.source === "INITIAL") return "موجودی اولیه";
  return m.type === "ENTRY" ? "ورود دستی" : "خروج دستی";
}

function matchMovementFilter(m: StockMovement, filter: MovementFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "entry":
      return m.type === "ENTRY";
    case "exit":
      return m.type === "EXIT";
    case "saleInvoice":
      return m.source === "INVOICE" && m.type === "EXIT";
    case "purchaseInvoice":
      return m.source === "INVOICE" && m.type === "ENTRY";
    case "manualEntry":
      return m.source === "MANUAL" && m.type === "ENTRY";
    case "manualExit":
      return m.source === "MANUAL" && m.type === "EXIT";
  }
}

export function getMovementReport(
  data: ReportDataSource,
  range: ReportRange,
  filter: MovementFilter
): MovementRow[] {
  return data.movements
    .filter((m) => inRange(m.date, range) && matchMovementFilter(m, filter))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .map((m) => {
      const invoice = m.invoiceId
        ? data.invoices.find((i) => i.id === m.invoiceId)
        : undefined;
      return {
        movement: m,
        productName:
          data.products.find((p) => p.id === m.productId)?.name ?? "(حذف‌شده)",
        sourceLabel: movementSourceLabel(m),
        invoiceId: invoice?.id,
        invoiceNumber: invoice?.invoiceNumber,
      };
    });
}
