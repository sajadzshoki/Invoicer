import type { Cheque, ChequeReminder } from "./types";
import { daysAgoIso } from "@/lib/jalali";

/**
 * دادهٔ نمونهٔ چک‌ها (فاز ۵)
 *
 * سازگاری با سایر بذرها:
 * - اثر مالی چک‌ها در `src/book/seed.ts` با رکوردهای دارای `chequeId`
 *   ثبت شده است (t-ch-1، t-ch-2، t-ch-6).
 * - چک‌های متصل به فاکتور به فاکتورهای با تسویهٔ چکی (INV-1007/INV-1008)
 *   در `src/invoices/seed.ts` ارجاع دارند.
 * - چک‌های برگشت‌خورده/باطل‌شده/خرج چک هیچ رکورد مالی‌ای ندارند.
 */

export const SEED_CHEQUES: Cheque[] = [
  /* دریافتی از مشتری، در انتظار وصول — متصل به فاکتور فروش */
  {
    id: "ch-1",
    invoiceId: "inv-1007",
    personId: "p-1",
    sourceType: "INVOICE",
    type: "RECEIVED",
    status: "PENDING",
    amount: 3_240_000,
    dueDate: daysAgoIso(-5),
    sayadiNumber: "1234567890123456",
    bank: "بانک ملی ایران",
    description: "چک بابت فاکتور فروش INV-1007",
    reminderId: "chr-1",
    createdAt: daysAgoIso(3),
    updatedAt: daysAgoIso(3),
  },

  /* پرداختی به تأمین‌کننده، در انتظار وصول — متصل به فاکتور خرید */
  {
    id: "ch-2",
    invoiceId: "inv-1008",
    personId: "p-2",
    sourceType: "INVOICE",
    type: "PAID",
    status: "PENDING",
    amount: 1_300_000,
    dueDate: daysAgoIso(-12),
    sayadiNumber: "2345678901234567",
    bank: "بانک صادرات ایران",
    description: "چک بابت فاکتور خرید INV-1008",
    reminderId: "chr-2",
    createdAt: daysAgoIso(4),
    updatedAt: daysAgoIso(4),
  },

  /* دریافتی مستقل — برگشت خورده؛ اثر مالی ندارد */
  {
    id: "ch-3",
    personId: "p-3",
    sourceType: "BOOKACCOUNT",
    type: "RECEIVED",
    status: "RETURNED",
    amount: 2_000_000,
    dueDate: daysAgoIso(3),
    sayadiNumber: "3456789012345678",
    bank: "بانک ملت",
    description: "چک دریافتی از رضا کریمی — عدم موجودی",
    reminderId: "chr-3",
    createdAt: daysAgoIso(15),
    updatedAt: daysAgoIso(3),
  },

  /* پرداختی مستقل — باطل شده؛ اثر مالی ندارد */
  {
    id: "ch-4",
    personId: "p-4",
    sourceType: "BOOKACCOUNT",
    type: "PAID",
    status: "CANCELLED",
    amount: 1_500_000,
    dueDate: daysAgoIso(-20),
    bank: "بانک پاسارگاد",
    description: "به‌دلیل تغییر توافق باطل شد",
    reminderId: "chr-4",
    createdAt: daysAgoIso(10),
    updatedAt: daysAgoIso(1),
  },

  /* خرج چک — چک دریافتی واگذارشده؛ دیگر در محاسبات نیست */
  {
    id: "ch-5",
    personId: "p-1",
    sourceType: "BOOKACCOUNT",
    type: "TRANSFERRED",
    status: "RECEIVED",
    amount: 4_000_000,
    dueDate: daysAgoIso(10),
    sayadiNumber: "4567890123456789",
    bank: "بانک سامان",
    description: "واگذارشده به تأمین‌کنندهٔ بسته‌بندی",
    reminderId: "chr-5",
    createdAt: daysAgoIso(18),
    updatedAt: daysAgoIso(8),
  },

  /* پرداختی مستقل — وصول شده؛ اثر مالی در دفتر حساب ثبت شده است */
  {
    id: "ch-6",
    personId: "p-2",
    sourceType: "BOOKACCOUNT",
    type: "PAID",
    status: "RECEIVED",
    amount: 800_000,
    dueDate: daysAgoIso(2),
    bank: "بانک ملت",
    description: "بابت بخشی از ماندهٔ حساب",
    reminderId: "chr-6",
    createdAt: daysAgoIso(9),
    updatedAt: daysAgoIso(2),
  },
];

export const SEED_CHEQUE_REMINDERS: ChequeReminder[] = [
  {
    id: "chr-1",
    chequeId: "ch-1",
    title: "یادآور سررسید چک",
    date: daysAgoIso(-5),
    description: "سررسید چک دریافتی از علی محمدی",
    createdAt: daysAgoIso(3),
  },
  {
    id: "chr-2",
    chequeId: "ch-2",
    title: "یادآور سررسید چک",
    date: daysAgoIso(-12),
    description: "سررسید چک پرداختی به شرکت پخش آریا",
    createdAt: daysAgoIso(4),
  },
  {
    id: "chr-3",
    chequeId: "ch-3",
    title: "یادآور سررسید چک",
    date: daysAgoIso(3),
    description: "سررسید چک دریافتی از رضا کریمی",
    createdAt: daysAgoIso(15),
  },
  {
    id: "chr-4",
    chequeId: "ch-4",
    title: "یادآور سررسید چک",
    date: daysAgoIso(-20),
    description: "سررسید چک پرداختی به فاطمه حسینی",
    createdAt: daysAgoIso(10),
  },
  {
    id: "chr-5",
    chequeId: "ch-5",
    title: "یادآور سررسید چک",
    date: daysAgoIso(10),
    description: "سررسید چک خرج‌شده",
    createdAt: daysAgoIso(18),
  },
  {
    id: "chr-6",
    chequeId: "ch-6",
    title: "یادآور سررسید چک",
    date: daysAgoIso(2),
    description: "سررسید چک پرداختی به شرکت پخش آریا",
    createdAt: daysAgoIso(9),
  },
];
