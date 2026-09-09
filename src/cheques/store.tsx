import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Cheque,
  ChequeAttachment,
  ChequeReminder,
  ChequeSourceType,
  ChequeStatus,
  ChequeType,
} from "./types";
import { allowedTransitions, hasSettlementEffect } from "./helpers";
import { SEED_CHEQUES, SEED_CHEQUE_REMINDERS } from "./seed";
import { useBookStore } from "@/book/store";
import { useInvoiceStore } from "@/invoices/store";
import { todayIso } from "@/lib/jalali";

/**
 * مخزن دادهٔ محلی ماژول چک‌ها (فاز ۵)
 *
 * قانون طلایی جلوگیری از شمارش مضاعف:
 * اثر مالی هر چک فقط از مسیر رکوردهای دفتر حساب با تگ `chequeId` اعمال
 * می‌شود؛ هر تغییر (وضعیت/مبلغ/نوع/حذف) ابتدا رکوردهای قبلیِ همان چک را
 * حذف و سپس اثر جدید را اعمال می‌کند.
 *
 * - چک متصل به فاکتور: ثبت چک، بدهی فاکتور را در ماندهٔ طرف حساب فعال
 *   می‌کند و فقط وضعیت «وصول شده» رکورد تسویه (دریافت/پرداخت) می‌سازد.
 * - چک متصل به دفتر حساب: فقط «وصول شده» و «خرج چک نبودن» اثر دارد.
 */

const STORAGE_KEY = "nasagh:cheques:v1";

interface ChequeData {
  cheques: Cheque[];
  reminders: ChequeReminder[];
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadInitial(): ChequeData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ChequeData;
      if (Array.isArray(parsed.cheques) && Array.isArray(parsed.reminders)) {
        return parsed;
      }
    }
  } catch {
    /* دادهٔ خراب → شروع با دادهٔ نمونه */
  }
  return { cheques: SEED_CHEQUES, reminders: SEED_CHEQUE_REMINDERS };
}

export interface ChequeInput {
  sourceType: ChequeSourceType;
  type: ChequeType;
  status: ChequeStatus;
  amount: number;
  dueDate: string;
  sayadiNumber?: string;
  bank?: string;
  description?: string;
  attachment?: ChequeAttachment;
  invoiceId?: string;
  personId?: string;
}

export type ChequeSaveResult =
  | { ok: true; cheque: Cheque }
  | { ok: false; error: string };

interface ChequeStoreValue extends ChequeData {
  getCheque: (id: string) => Cheque | undefined;
  /** ساخت/ویرایش چک با اعمال اثر مالی (بدون اثر مضاعف) */
  saveCheque: (input: ChequeInput, editId?: string) => ChequeSaveResult;
  /** تغییر وضعیت با گذار مجاز و اعمال/بازگشت اثر مالی */
  changeStatus: (id: string, target: ChequeStatus) => ChequeSaveResult;
  /** حذف چک با بازگشت کامل اثر مالی آن */
  deleteCheque: (id: string) => void;
  /** چک‌های متصل به یک فاکتور */
  invoiceCheques: (invoiceId: string) => Cheque[];
  /** مجموع مبلغ چک‌های وصول‌شدهٔ متصل به یک فاکتور */
  settledByCheques: (invoiceId: string) => number;
  resetToSample: () => void;
}

const ChequeContext = createContext<ChequeStoreValue | null>(null);

export function ChequeProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ChequeData>(loadInitial);
  const book = useBookStore();
  const invoiceStore = useInvoiceStore();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* پر بودن حافظهٔ محلی مانع کار با اپ نمی‌شود */
    }
  }, [data]);

  /**
   * اعمال اثر مالی چک بر دفتر حساب:
   * ۱) حذف رکوردهای قبلیِ همین چک ۲) ساخت رکوردها بر اساس وضعیت فعلی.
   */
  const applyEffect = useCallback(
    (cheque: Cheque) => {
      book.removeTransactionsForCheque(cheque.id);
      if (!cheque.personId) return;

      const invoice = cheque.invoiceId
        ? invoiceStore.getInvoice(cheque.invoiceId)
        : undefined;

      // چک متصل به فاکتور: خودِ ثبت چک، بدهی فاکتور را فعال می‌کند
      if (cheque.sourceType === "INVOICE" && invoice) {
        book.addTransaction({
          personId: cheque.personId,
          type: invoice.type === "SELL" ? "SALE_INVOICE" : "PURCHASE_INVOICE",
          amount: cheque.amount,
          date: todayIso(),
          description: `بابت چک فاکتور ${
            invoice.type === "SELL" ? "فروش" : "خرید"
          } ${invoice.invoiceNumber}`,
          invoiceId: invoice.id,
          chequeId: cheque.id,
        });
      }

      // فقط «وصول شده» (و خرج چک نبودن) رکورد تسویه می‌سازد
      if (!hasSettlementEffect(cheque)) return;

      if (cheque.sourceType === "INVOICE" && invoice) {
        book.addTransaction({
          personId: cheque.personId,
          type: invoice.type === "SELL" ? "RECEIVED" : "PAID",
          amount: cheque.amount,
          date: todayIso(),
          description: `وصول چک فاکتور ${invoice.invoiceNumber}`,
          invoiceId: invoice.id,
          chequeId: cheque.id,
        });
      } else if (cheque.sourceType === "BOOKACCOUNT") {
        book.addTransaction({
          personId: cheque.personId,
          type: cheque.type === "RECEIVED" ? "RECEIVED" : "PAID",
          amount: cheque.amount,
          date: todayIso(),
          description:
            cheque.type === "RECEIVED"
              ? "وصول چک دریافتی"
              : "وصول چک پرداختی",
          chequeId: cheque.id,
        });
      }
    },
    [book, invoiceStore]
  );

  const saveCheque = useCallback(
    (input: ChequeInput, editId?: string): ChequeSaveResult => {
      if (!(input.amount > 0)) {
        return { ok: false, error: "مبلغ چک باید بیشتر از صفر باشد." };
      }
      if (!input.dueDate) {
        return { ok: false, error: "تاریخ سررسید را مشخص کنید." };
      }

      const invoice = input.invoiceId
        ? invoiceStore.getInvoice(input.invoiceId)
        : undefined;
      if (input.sourceType === "INVOICE" && !invoice) {
        return { ok: false, error: "فاکتور مرتبط با چک پیدا نشد." };
      }
      if (input.sourceType === "BOOKACCOUNT" && !input.personId) {
        return { ok: false, error: "طرف حساب چک را انتخاب کنید." };
      }

      const prev = editId ? data.cheques.find((c) => c.id === editId) : undefined;
      const now = new Date().toISOString();
      const chequeId = editId ?? makeId("ch");

      const cheque: Cheque = {
        id: chequeId,
        invoiceId: invoice?.id,
        personId: invoice?.personId ?? input.personId,
        sourceType: input.sourceType,
        type: input.type,
        status: input.status,
        amount: input.amount,
        dueDate: input.dueDate,
        sayadiNumber: input.sayadiNumber?.trim() || undefined,
        bank: input.bank?.trim() || undefined,
        description: input.description?.trim() || undefined,
        attachment: input.attachment,
        reminderId: prev?.reminderId ?? makeId("chr"),
        createdAt: prev?.createdAt ?? now,
        updatedAt: now,
      };

      // یادآور محلی سررسید
      const reminder: ChequeReminder = {
        id: cheque.reminderId!,
        chequeId,
        title: "یادآور سررسید چک",
        date: input.dueDate,
        description: invoice
          ? `سررسید چک فاکتور ${invoice.invoiceNumber}`
          : "سررسید چک ثبت‌شده",
        createdAt: now,
      };

      // اثر مالی — حذف رکوردهای قبلی و اعمال دوباره
      applyEffect(cheque);

      setData((d) => ({
        cheques: d.cheques.some((c) => c.id === chequeId)
          ? d.cheques.map((c) => (c.id === chequeId ? cheque : c))
          : [cheque, ...d.cheques],
        reminders: [
          reminder,
          ...d.reminders.filter((r) => r.id !== reminder.id),
        ],
      }));

      return { ok: true, cheque };
    },
    [data.cheques, invoiceStore, applyEffect]
  );

  const changeStatus = useCallback(
    (id: string, target: ChequeStatus): ChequeSaveResult => {
      const cheque = data.cheques.find((c) => c.id === id);
      if (!cheque) return { ok: false, error: "چک پیدا نشد." };
      if (!allowedTransitions(cheque.status).includes(target)) {
        return { ok: false, error: "این تغییر وضعیت مجاز نیست." };
      }
      const updated: Cheque = {
        ...cheque,
        status: target,
        updatedAt: new Date().toISOString(),
      };
      applyEffect(updated);
      setData((d) => ({
        ...d,
        cheques: d.cheques.map((c) => (c.id === id ? updated : c)),
      }));
      return { ok: true, cheque: updated };
    },
    [data.cheques, applyEffect]
  );

  const deleteCheque = useCallback(
    (id: string) => {
      book.removeTransactionsForCheque(id);
      setData((d) => ({
        cheques: d.cheques.filter((c) => c.id !== id),
        reminders: d.reminders.filter((r) => r.chequeId !== id),
      }));
    },
    [book]
  );

  const getCheque = useCallback(
    (id: string) => data.cheques.find((c) => c.id === id),
    [data.cheques]
  );

  const invoiceCheques = useCallback(
    (invoiceId: string) =>
      data.cheques.filter((c) => c.invoiceId === invoiceId),
    [data.cheques]
  );

  const settledByCheques = useCallback(
    (invoiceId: string) =>
      data.cheques
        .filter(
          (c) =>
            c.invoiceId === invoiceId &&
            c.sourceType === "INVOICE" &&
            hasSettlementEffect(c)
        )
        .reduce((sum, c) => sum + c.amount, 0),
    [data.cheques]
  );

  const resetToSample = useCallback(() => {
    setData({ cheques: SEED_CHEQUES, reminders: SEED_CHEQUE_REMINDERS });
  }, []);

  const value = useMemo<ChequeStoreValue>(
    () => ({
      ...data,
      getCheque,
      saveCheque,
      changeStatus,
      deleteCheque,
      invoiceCheques,
      settledByCheques,
      resetToSample,
    }),
    [
      data,
      getCheque,
      saveCheque,
      changeStatus,
      deleteCheque,
      invoiceCheques,
      settledByCheques,
      resetToSample,
    ]
  );

  return (
    <ChequeContext.Provider value={value}>{children}</ChequeContext.Provider>
  );
}

export function useChequeStore(): ChequeStoreValue {
  const ctx = useContext(ChequeContext);
  if (!ctx) {
    throw new Error("useChequeStore باید داخل ChequeProvider استفاده شود");
  }
  return ctx;
}
