import type {
  BookAccountTransaction,
  DeviceContact,
  PartyNote,
  PartyReminder,
  Person,
} from "./types";
import { daysAgoIso } from "@/lib/jalali";

/**
 * دادهٔ نمونهٔ فاز ۲ — صرفاً برای تجربهٔ واقعی رابط کاربری.
 * در فازهای بعد با اتصال به بک‌اند جایگزین می‌شود.
 */

const nowIso = () => new Date().toISOString();

export const SEED_PERSONS: Person[] = [
  {
    id: "p-1",
    name: "علی محمدی",
    phone: "09123456789",
    address: "تهران، خیابان ولیعصر، کوچهٔ مهر، پلاک ۱۲",
    birthDate: "1990-05-14",
    createdAt: daysAgoIso(45),
  },
  {
    id: "p-2",
    name: "شرکت پخش آریا",
    phone: "02188776655",
    address: "تهران، خیابان آزادی، برج نگین، طبقهٔ ۳",
    createdAt: daysAgoIso(60),
  },
  {
    id: "p-3",
    name: "رضا کریمی",
    phone: "09351234567",
    createdAt: daysAgoIso(32),
  },
  {
    id: "p-4",
    name: "فاطمه حسینی",
    phone: "09198765432",
    address: "کرج، بلوار طالقانی، نبش خیابان بهار",
    createdAt: daysAgoIso(6),
  },
  {
    // مشتری بدون نام مشخص — انتخاب پیش‌فرض هنگام صدور فاکتور فروش
    id: "p-gen",
    name: "مشتری عمومی",
    createdAt: daysAgoIso(60),
  },
];

export const SEED_TRANSACTIONS: BookAccountTransaction[] = [
  // علی محمدی — بدهکار
  {
    id: "t-1",
    personId: "p-1",
    type: "SALE_INVOICE",
    amount: 12_500_000,
    date: daysAgoIso(18),
    description: "فاکتور فروش لوازم جانبی",
    createdAt: nowIso(),
  },
  {
    id: "t-2",
    personId: "p-1",
    type: "RECEIVED",
    amount: 8_000_000,
    date: daysAgoIso(10),
    description: "دریافت کارت‌به‌کارت",
    createdAt: nowIso(),
  },
  {
    id: "t-3",
    personId: "p-1",
    type: "SALE_INVOICE",
    amount: 3_200_000,
    date: daysAgoIso(4),
    description: "فاکتور فروش شارژر و قاب",
    createdAt: nowIso(),
  },
  {
    id: "t-4",
    personId: "p-1",
    type: "RECEIVED",
    amount: 1_000_000,
    date: daysAgoIso(1),
    description: "بابت ماندهٔ فاکتور اول",
    createdAt: nowIso(),
  },

  // شرکت پخش آریا — بستانکار
  {
    id: "t-5",
    personId: "p-2",
    type: "PURCHASE_INVOICE",
    amount: 45_000_000,
    date: daysAgoIso(25),
    description: "خرید عمدهٔ کالا",
    createdAt: nowIso(),
  },
  {
    id: "t-6",
    personId: "p-2",
    type: "PAID",
    amount: 30_000_000,
    date: daysAgoIso(12),
    description: "پرداخت از حساب فروشگاه",
    createdAt: nowIso(),
  },

  // رضا کریمی — تسویه‌شده
  {
    id: "t-7",
    personId: "p-3",
    type: "SALE_INVOICE",
    amount: 5_000_000,
    date: daysAgoIso(30),
    description: "فاکتور فروش",
    createdAt: nowIso(),
  },
  {
    id: "t-8",
    personId: "p-3",
    type: "RECEIVED",
    amount: 5_000_000,
    date: daysAgoIso(20),
    description: "تسویهٔ کامل",
    createdAt: nowIso(),
  },

  // فاطمه حسینی — بدهکار
  {
    id: "t-9",
    personId: "p-4",
    type: "PAID",
    amount: 2_000_000,
    date: daysAgoIso(2),
    description: "قرض‌الحسنه",
    createdAt: nowIso(),
  },

  /* ---------- رکوردهای متصل به فاکتورهای نمونه (فاز ۴) ---------- */
  // فاکتور فروش INV-1002 — نسیه، مانده کامل به‌عنوان طلب
  {
    id: "t-inv-1002",
    personId: "p-4",
    type: "SALE_INVOICE",
    amount: 6_060_000,
    date: daysAgoIso(5),
    description: "بابت فاکتور فروش INV-1002",
    invoiceId: "inv-1002",
    createdAt: nowIso(),
  },
  // فاکتور فروش INV-1003 — اقساطی: ثبت کامل فروش + پیش‌پرداخت
  {
    id: "t-inv-1003a",
    personId: "p-1",
    type: "SALE_INVOICE",
    amount: 10_000_000,
    date: daysAgoIso(2),
    description: "بابت فاکتور فروش INV-1003",
    invoiceId: "inv-1003",
    createdAt: nowIso(),
  },
  {
    id: "t-inv-1003b",
    personId: "p-1",
    type: "RECEIVED",
    amount: 4_000_000,
    date: daysAgoIso(2),
    description: "پیش‌پرداخت فاکتور INV-1003",
    invoiceId: "inv-1003",
    createdAt: nowIso(),
  },
  // فاکتور خرید INV-1004 — نسیه، مانده کامل به‌عنوان بدهی ما
  {
    id: "t-inv-1004",
    personId: "p-2",
    type: "PURCHASE_INVOICE",
    amount: 6_890_000,
    date: daysAgoIso(9),
    description: "بابت فاکتور خرید INV-1004",
    invoiceId: "inv-1004",
    createdAt: nowIso(),
  },
];

export const SEED_NOTES: PartyNote[] = [
  {
    id: "n-1",
    personId: "p-1",
    text: "ترجیح می‌دهد پرداخت‌ها را کارت‌به‌کارت انجام دهد.",
    createdAt: new Date(Date.now() - 6 * 86_400_000).toISOString(),
  },
  {
    id: "n-2",
    personId: "p-2",
    text: "فاکتورهای رسمی باید با نام شرکت صادر شوند.",
    createdAt: new Date(Date.now() - 15 * 86_400_000).toISOString(),
  },
];

export const SEED_REMINDERS: PartyReminder[] = [
  {
    id: "r-1",
    personId: "p-1",
    title: "پیگیری مانده‌حساب",
    date: daysAgoIso(-1),
    time: "10:30",
    description: "تماس برای هماهنگی پرداخت باقی‌ماندهٔ فاکتورها",
    createdAt: nowIso(),
  },
];

/* --------------------- مخاطبین نمونه (افزودن از مخاطبین) --------------------- */

const MOCK_CONTACTS: DeviceContact[] = [
  { id: "c-1", name: "سارا احمدی", phone: "09121112233" },
  { id: "c-2", name: "حسین رضایی", phone: "09354445566" },
  { id: "c-3", name: "نگار موسوی", phone: "09197778899" },
  { id: "c-4", name: "امیر تهرانی", phone: "09126663344" },
  { id: "c-5", name: "مریم کاظمی", phone: "09361239876" },
  { id: "c-6", name: "بازرگانی نیک‌نام", phone: "02144332211" },
  { id: "c-7", name: "مهدی شریفی", phone: "09901110022" },
];

/**
 * سرویس مخاطبین — نقطهٔ اتصال آینده به مخاطبین دستگاه.
 * برای اتصال بومی کافی است فقط پیاده‌سازی `list` جایگزین شود؛
 * بقیهٔ رابط کاربری بدون تغییر باقی می‌ماند.
 */
export const contactsService = {
  async list(): Promise<DeviceContact[]> {
    await new Promise((resolve) => setTimeout(resolve, 650));
    return MOCK_CONTACTS;
  },
};
