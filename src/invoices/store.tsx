import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  Invoice,
  InvoiceExtraCost,
  InvoiceItem,
  InvoiceType,
  PaymentType,
  ShippingStatus,
} from "./types";
import { computeTotals, deriveStatus, nextInvoiceNumber } from "./helpers";
import { SEED_INVOICES } from "./seed";
import { useBookStore } from "@/book/store";
import { useInventoryStore } from "@/inventory/store";

/**
 * مخزن دادهٔ محلی ماژول فاکتورها (فاز ۴)
 *
 * فاکتور «منبع حقیقت» است:
 * - اثر انباری فاکتور فروش/خرید به‌صورت حرکت انبار با منبع INVOICE و
 *   شناسهٔ فاکتور ثبت می‌شود؛ هنگام ویرایش/حذف، اثر قبلی بازگشت می‌خورد.
 * - اثر مالی فاکتور به‌صورت رکورد دفتر حساب با شناسهٔ فاکتور ثبت می‌شود
 *   و ماندهٔ طرف حساب از روی همان رکوردها محاسبه می‌شود.
 * - پیش‌فاکتور هیچ اثر مالی یا انباری ندارد.
 * - چک هنوز پیاده نشده؛ فاکتور چکی رکورد مالی نمی‌سازد و در فاز چک‌ها
 *   با وضعیت چک تسویه می‌شود.
 */

const STORAGE_KEY = "nasagh:invoices:v1";

/** نام مشتری بدون هویت — انتخاب پیش‌فرض فاکتور فروش */
export const GENERAL_CUSTOMER_NAME = "مشتری عمومی";

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadInitial(): Invoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Invoice[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* دادهٔ خراب → شروع با دادهٔ نمونه */
  }
  return SEED_INVOICES;
}

/* ------------------------------ ورودی فرم ------------------------------ */

export interface InvoiceLineInput {
  productId: string;
  productType: "PRODUCT" | "SERVICE";
  nameSnapshot: string;
  imageSnapshot?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discount: number;
}

export interface InvoiceInput {
  type: InvoiceType;
  personId: string;
  date: string;
  time: string;
  items: InvoiceLineInput[];
  /** تخفیف کل فاکتور */
  discount: number;
  taxEnabled: boolean;
  taxRate: number;
  extraCosts: Array<{ title: string; amount: number }>;
  paymentType: PaymentType;
  paidAmount: number;
  shippingStatus?: ShippingStatus;
  description?: string;
  note?: string;
  signature?: string;
  customerContact?: string;
}

export type SaveResult =
  | { ok: true; invoice: Invoice }
  | { ok: false; error: string };

interface InvoiceStoreValue {
  invoices: Invoice[];
  getInvoice: (id: string) => Invoice | undefined;
  /** پیش‌نمایش شمارهٔ فاکتور بعدی */
  nextNumber: string;
  /** ساخت/ویرایش فاکتور با اعمال اثر انباری و مالی (بدون اثر مضاعف) */
  saveInvoice: (input: InvoiceInput, editId?: string) => SaveResult;
  /** حذف فاکتور با بازگشت اثر انباری و مالی آن */
  deleteInvoice: (id: string) => void;
  /** کپی فاکتور به‌صورت پیش‌فاکتور جدید */
  copyInvoice: (id: string) => Invoice | null;
  resetToSample: () => void;
}

const InvoiceContext = createContext<InvoiceStoreValue | null>(null);

export function InvoiceProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(loadInitial);
  const book = useBookStore();
  const inventory = useInventoryStore();
  const ensuredGeneral = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
    } catch {
      /* پر بودن حافظهٔ محلی مانع کار با اپ نمی‌شود */
    }
  }, [invoices]);

  // تضمین وجود «مشتری عمومی» برای انتخاب پیش‌فرض فاکتور فروش
  useEffect(() => {
    if (ensuredGeneral.current) return;
    ensuredGeneral.current = true;
    if (!book.persons.some((p) => p.name === GENERAL_CUSTOMER_NAME)) {
      book.addParty({ name: GENERAL_CUSTOMER_NAME });
    }
    // فقط یک‌بار در عمر اپ اجرا می‌شود
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nextNumber = useMemo(
    () => nextInvoiceNumber(invoices.map((i) => i.invoiceNumber)),
    [invoices]
  );

  const getInvoice = useCallback(
    (id: string) => invoices.find((i) => i.id === id),
    [invoices]
  );

  const saveInvoice = useCallback(
    (input: InvoiceInput, editId?: string): SaveResult => {
      /* ---------- ۱) اعتبارسنجی و محاسبهٔ جمع‌ها ---------- */
      if (input.items.length === 0) {
        return { ok: false, error: "حداقل یک قلم به فاکتور اضافه کنید." };
      }

      const items: InvoiceItem[] = input.items.map((line) => {
        const total = Math.max(
          0,
          line.quantity * line.unitPrice - line.discount
        );
        return {
          id: makeId("ii"),
          productId: line.productId,
          productType: line.productType,
          nameSnapshot: line.nameSnapshot,
          imageSnapshot: line.imageSnapshot,
          quantity: line.quantity,
          unit: line.unit,
          unitPrice: line.unitPrice,
          discount: Math.max(0, line.discount),
          total,
        };
      });

      const grossTotal = items.reduce(
        (sum, it) => sum + it.quantity * it.unitPrice,
        0
      );
      const itemsDiscount = items.reduce((sum, it) => sum + it.discount, 0);
      const extraCosts: InvoiceExtraCost[] = input.extraCosts.map((ec) => ({
        id: makeId("ec"),
        title: ec.title,
        amount: ec.amount,
      }));
      const totals = computeTotals({
        grossTotal,
        itemsDiscount,
        discount: input.discount,
        taxEnabled: input.taxEnabled,
        taxRate: input.taxRate,
        extraCostsTotal: extraCosts.reduce((sum, ec) => sum + ec.amount, 0),
      });

      const isFinancial = input.type !== "DRAFT";

      /* ---------- ۲) کنترل موجودی برای فاکتور فروش ---------- */
      if (input.type === "SELL") {
        const required = new Map<string, number>();
        for (const it of items) {
          if (it.productType !== "PRODUCT") continue;
          required.set(
            it.productId,
            (required.get(it.productId) ?? 0) + it.quantity
          );
        }
        for (const [productId, qty] of required) {
          const product = inventory.products.find((p) => p.id === productId);
          if (!product) continue;
          // هنگام ویرایش، مقدار فروخته‌شدهٔ همین فاکتور به موجودی برمی‌گردد
          const restored = editId
            ? inventory.soldByInvoice(editId, productId)
            : 0;
          const available = (product.currentStock ?? 0) + restored;
          if (qty > available) {
            return {
              ok: false,
              error: `موجودی «${product.name}» کافی نیست؛ در دسترس: ${available} واحد.`,
            };
          }
        }
      }

      /* ---------- ۳) بازگشت اثر فاکتور قبلی (جلوگیری از اثر مضاعف) ---------- */
      if (editId) {
        inventory.removeMovementsForInvoice(editId);
        book.removeTransactionsForInvoice(editId);
      }

      /* ---------- ۴) ساخت رکورد فاکتور ---------- */
      const prev = editId
        ? invoices.find((i) => i.id === editId)
        : undefined;
      const now = new Date().toISOString();

      let paymentType: PaymentType = input.paymentType;
      let paidAmount = Math.max(0, input.paidAmount);
      if (!isFinancial) {
        // پیش‌فاکتور تسویه ندارد
        paymentType = "CASH";
        paidAmount = 0;
      } else if (paymentType === "CASH") {
        paidAmount = totals.totalAmount;
      } else if (paymentType === "CREDIT" || paymentType === "CHEQUE") {
        paidAmount = 0;
      } else if (paymentType === "INSTALLMENT") {
        paidAmount = Math.min(paidAmount, totals.totalAmount);
      }

      const invoice: Invoice = {
        id: editId ?? makeId("inv"),
        invoiceNumber: prev?.invoiceNumber ?? nextNumber,
        type: input.type,
        personId: input.personId,
        date: input.date,
        time: input.time,
        items,
        grossTotal: totals.grossTotal,
        itemsDiscount: totals.itemsDiscount,
        discount: totals.discount,
        subtotal: totals.subtotal,
        taxEnabled: input.taxEnabled,
        taxRate: input.taxRate,
        taxAmount: totals.taxAmount,
        extraCosts,
        totalAmount: totals.totalAmount,
        paymentType,
        paidAmount,
        shippingStatus: isFinancial ? input.shippingStatus : undefined,
        description: input.description?.trim() || undefined,
        note: input.note?.trim() || undefined,
        signature: input.signature?.trim() || undefined,
        customerContact: input.customerContact?.trim() || undefined,
        status: deriveStatus({ type: input.type, paymentType, paidAmount }),
        createdAt: prev?.createdAt ?? now,
        updatedAt: now,
      };

      /* ---------- ۵) اثر انباری (فقط فاکتور مالی و فقط کالا) ---------- */
      if (isFinancial) {
        for (const item of items) {
          if (item.productType !== "PRODUCT") continue;
          inventory.applyMovement({
            productId: item.productId,
            type: input.type === "SELL" ? "EXIT" : "ENTRY",
            quantity: item.quantity,
            date: invoice.date,
            description:
              input.type === "SELL"
                ? `فروش با فاکتور ${invoice.invoiceNumber}`
                : `خرید با فاکتور ${invoice.invoiceNumber}`,
            source: "INVOICE",
            invoiceId: invoice.id,
          });
        }

        /* ---------- ۶) اثر مالی بر دفتر حساب طرف حساب ---------- */
        // مانده‌ای که این فاکتور ایجاد می‌کند:
        // نقدی → صفر | نسیه → کل مبلغ | اقساط → باقی‌مانده | چک → تا فاز چک‌ها صفر
        const outstanding =
          paymentType === "CREDIT"
            ? invoice.totalAmount
            : paymentType === "INSTALLMENT"
              ? Math.max(0, invoice.totalAmount - paidAmount)
              : 0;

        if (outstanding > 0) {
          book.addTransaction({
            personId: invoice.personId,
            type: input.type === "SELL" ? "SALE_INVOICE" : "PURCHASE_INVOICE",
            amount: outstanding,
            date: invoice.date,
            description:
              input.type === "SELL"
                ? `بابت فاکتور فروش ${invoice.invoiceNumber}`
                : `بابت فاکتور خرید ${invoice.invoiceNumber}`,
            invoiceId: invoice.id,
          });
        }
        // ثبت پیش‌پرداخت اقساط به‌عنوان دریافت/پرداخت جدا
        if (paymentType === "INSTALLMENT" && paidAmount > 0) {
          book.addTransaction({
            personId: invoice.personId,
            type: input.type === "SELL" ? "RECEIVED" : "PAID",
            amount: paidAmount,
            date: invoice.date,
            description:
              input.type === "SELL"
                ? `پیش‌پرداخت فاکتور ${invoice.invoiceNumber}`
                : `پیش‌پرداخت فاکتور ${invoice.invoiceNumber}`,
            invoiceId: invoice.id,
          });
        }
        // چک: هیچ رکورد مالی‌ای ساخته نمی‌شود تا وضعیت چک در فاز بعد ثبت شود.
      }

      /* ---------- ۷) ذخیرهٔ فاکتور ---------- */
      setInvoices((list) => {
        const exists = list.some((i) => i.id === invoice.id);
        return exists
          ? list.map((i) => (i.id === invoice.id ? invoice : i))
          : [invoice, ...list];
      });

      return { ok: true, invoice };
    },
    [invoices, inventory, book, nextNumber]
  );

  const deleteInvoice = useCallback(
    (id: string) => {
      // بازگشت اثر انباری و مالی، سپس حذف رکورد
      inventory.removeMovementsForInvoice(id);
      book.removeTransactionsForInvoice(id);
      setInvoices((list) => list.filter((i) => i.id !== id));
    },
    [inventory, book]
  );

  const copyInvoice = useCallback(
    (id: string): Invoice | null => {
      const source = invoices.find((i) => i.id === id);
      if (!source) return null;
      const now = new Date().toISOString();
      const copy: Invoice = {
        ...source,
        id: makeId("inv"),
        invoiceNumber: nextInvoiceNumber(invoices.map((i) => i.invoiceNumber)),
        type: "DRAFT",
        date: now.slice(0, 10),
        time: now.slice(11, 16),
        items: source.items.map((it) => ({ ...it, id: makeId("ii") })),
        extraCosts: source.extraCosts.map((ec) => ({
          ...ec,
          id: makeId("ec"),
        })),
        paymentType: "CASH",
        paidAmount: 0,
        shippingStatus: undefined,
        status: "DRAFT",
        createdAt: now,
        updatedAt: now,
      };
      setInvoices((list) => [copy, ...list]);
      return copy;
    },
    [invoices]
  );

  const resetToSample = useCallback(() => {
    setInvoices(SEED_INVOICES);
  }, []);

  const value = useMemo<InvoiceStoreValue>(
    () => ({
      invoices,
      getInvoice,
      nextNumber,
      saveInvoice,
      deleteInvoice,
      copyInvoice,
      resetToSample,
    }),
    [
      invoices,
      getInvoice,
      nextNumber,
      saveInvoice,
      deleteInvoice,
      copyInvoice,
      resetToSample,
    ]
  );

  return (
    <InvoiceContext.Provider value={value}>{children}</InvoiceContext.Provider>
  );
}

export function useInvoiceStore(): InvoiceStoreValue {
  const ctx = useContext(InvoiceContext);
  if (!ctx) {
    throw new Error("useInvoiceStore باید داخل InvoiceProvider استفاده شود");
  }
  return ctx;
}
