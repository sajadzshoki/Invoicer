import { useMemo } from "react";
import { useBookStore } from "@/book/store";
import { useInvoiceStore } from "@/invoices/store";
import { useInventoryStore } from "@/inventory/store";
import { useChequeStore } from "@/cheques/store";
import { useCostStore } from "@/costs/store";
import type { Person, BookAccountTransaction } from "@/book/types";
import type { Invoice } from "@/invoices/types";
import type { Product, ProductCategory, StockMovement } from "@/inventory/types";
import type { Cheque } from "@/cheques/types";
import type { RegisterCost, CostCategory } from "@/costs/types";

/**
 * منبع دادهٔ گزارش‌ها (فاز ۶)
 *
 * این تنها یک «نمای خواندنی و نرمال‌شده» از مخازن موجود است؛ هیچ رکورد
 * جدیدی ساخته نمی‌شود. سلکتورهای گزارش فقط از همین ساختار می‌خوانند تا:
 * - محاسبات خالص و قابل تست بمانند
 * - بعداً بتوان همین سلکتورها را به دادهٔ بک‌اند وصل کرد
 */

export interface ReportDataSource {
  persons: Person[];
  transactions: BookAccountTransaction[];
  invoices: Invoice[];
  products: Product[];
  productCategories: ProductCategory[];
  movements: StockMovement[];
  cheques: Cheque[];
  costs: RegisterCost[];
  costCategories: CostCategory[];
  /** چک‌های تسویه‌شدهٔ هر فاکتور — برای ماندهٔ دقیق فاکتورهای چکی */
  settledByCheques: (invoiceId: string) => number;
}

/** جمع‌آوری دادهٔ خواندنی از همهٔ مخازن — بدون هیچ تغییر */
export function useReportData(): ReportDataSource {
  const book = useBookStore();
  const invoiceStore = useInvoiceStore();
  const inventory = useInventoryStore();
  const chequeStore = useChequeStore();
  const costStore = useCostStore();

  return useMemo<ReportDataSource>(
    () => ({
      persons: book.persons,
      transactions: book.transactions,
      invoices: invoiceStore.invoices,
      products: inventory.products,
      productCategories: inventory.categories,
      movements: inventory.movements,
      cheques: chequeStore.cheques,
      costs: costStore.costs,
      costCategories: costStore.categories,
      settledByCheques: chequeStore.settledByCheques,
    }),
    [book, invoiceStore, inventory, chequeStore, costStore]
  );
}

/* ------------------------------ ابزارهای مشترک سلکتورها ------------------------------ */

/** فاکتورهای مالی قطعی (بدون پیش‌فاکتور) — تنها منبع فروش/خرید */
export function finalizedInvoices(data: ReportDataSource): Invoice[] {
  return data.invoices.filter((inv) => inv.type !== "DRAFT");
}

/** فاکتورهای فروش قطعی */
export function sellInvoices(data: ReportDataSource): Invoice[] {
  return data.invoices.filter((inv) => inv.type === "SELL");
}

/** فاکتورهای خرید قطعی */
export function buyInvoices(data: ReportDataSource): Invoice[] {
  return data.invoices.filter((inv) => inv.type === "BUY");
}

/** نام شخص با شناسه — برای افراد حذف‌شده برچسب مناسب */
export function personName(data: ReportDataSource, personId?: string): string {
  if (!personId) return "—";
  return data.persons.find((p) => p.id === personId)?.name ?? "(حذف‌شده)";
}

/** نام دستهٔ کالا/خدمت */
export function productCategoryName(
  data: ReportDataSource,
  categoryId?: string
): string {
  if (!categoryId) return "بدون دسته";
  return data.productCategories.find((c) => c.id === categoryId)?.name ?? "بدون دسته";
}
