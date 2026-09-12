/**
 * پشتیبان‌گیری و بازیابی داده‌ها (فاز ۷)
 *
 * - خروجی: همهٔ مخازن در یک فایل JSON نسخه‌بندی‌شده
 * - ورودی: ابتدا «اعتبارسنجی کامل»، سپس جایگزینی یک‌جا و ریلود —
 *   هیچ حالتی بینابینی وجود ندارد و با فایل نامعتبر هیچ داده‌ای بازنویسی نمی‌شود.
 * - مقادیر مالی هرگز تبدیل نمی‌شوند؛ همان‌طور که ذخیره‌اند منتقل می‌شوند.
 */

import { todayIso } from "@/lib/jalali";
import { APP_VERSION, SETTINGS_STORAGE_KEY } from "./defaults";

/** کلیدهای ذخیره‌سازی محلی — تنها منبع حقیقت برای پشتیبان‌گیری */
export const BACKUP_STORE_KEYS = {
  book: "nasagh:book:v2",
  inventory: "nasagh:inventory:v1",
  invoices: "nasagh:invoices:v1",
  cheques: "nasagh:cheques:v1",
  costs: "nasagh:costs:v1",
  settings: SETTINGS_STORAGE_KEY,
  theme: "nasagh:theme",
} as const;

export const BACKUP_FORMAT_VERSION = 1;

export interface BackupFile {
  app: "nasagh-backup";
  version: number;
  exportedAt: string;
  appVersion: string;
  stores: {
    book?: unknown;
    inventory?: unknown;
    invoices?: unknown;
    cheques?: unknown;
    costs?: unknown;
    settings?: unknown;
    theme?: unknown;
  };
}

export interface BackupSummary {
  version: number;
  exportedAt: string;
  appVersion: string;
  counts: { label: string; count: number }[];
}

export type BackupValidation =
  | { ok: true; summary: BackupSummary; file: BackupFile }
  | { ok: false; error: string };

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

/** ساخت فایل پشتیبان کامل از همهٔ مخازن */
export function collectBackup(): BackupFile {
  return {
    app: "nasagh-backup",
    version: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    stores: {
      book: readJson(BACKUP_STORE_KEYS.book),
      inventory: readJson(BACKUP_STORE_KEYS.inventory),
      invoices: readJson(BACKUP_STORE_KEYS.invoices),
      cheques: readJson(BACKUP_STORE_KEYS.cheques),
      costs: readJson(BACKUP_STORE_KEYS.costs),
      settings: readJson(BACKUP_STORE_KEYS.settings),
      theme: (() => {
        try {
          return localStorage.getItem(BACKUP_STORE_KEYS.theme) ?? undefined;
        } catch {
          return undefined;
        }
      })(),
    },
  };
}

/** دانلود فایل پشتیبان با نام نسخه‌دار */
export function downloadBackup(): string {
  const file = collectBackup();
  const json = JSON.stringify(file, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nasagh-backup-${todayIso()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
  return a.download;
}

/* ------------------------------ اعتبارسنجی ------------------------------ */

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isArrayOfObjects(v: unknown): v is Record<string, unknown>[] {
  return Array.isArray(v) && v.every((item) => isObject(item));
}

/** شمارش رکوردهای هر مخزن برای نمایش قبل از بازیابی */
function summarizeStores(stores: BackupFile["stores"]): { label: string; count: number }[] {
  const book = isObject(stores.book) ? stores.book : {};
  const inventory = isObject(stores.inventory) ? stores.inventory : {};
  const cheques = isObject(stores.cheques) ? stores.cheques : {};
  const costs = isObject(stores.costs) ? stores.costs : {};
  const countOf = (v: unknown) => (Array.isArray(v) ? v.length : 0);
  return [
    { label: "طرف حساب‌ها", count: countOf(book.persons) },
    { label: "تراکنش‌های دفتر حساب", count: countOf(book.transactions) },
    { label: "یادداشت‌ها و یادآورهای طرف حساب", count: countOf(book.notes) + countOf(book.reminders) },
    { label: "کالاها و خدمات", count: countOf(inventory.products) },
    { label: "حرکات انبار", count: countOf(inventory.movements) },
    { label: "دسته‌های کالا", count: countOf(inventory.categories) },
    { label: "فاکتورها", count: countOf(stores.invoices) },
    { label: "چک‌ها", count: countOf(cheques.cheques) },
    { label: "یادآورهای چک", count: countOf(cheques.reminders) },
    { label: "هزینه‌ها و درآمدها", count: countOf(costs.costs) },
    { label: "دسته‌های هزینه/درآمد", count: countOf(costs.categories) },
  ];
}

/**
 * اعتبارسنجی کامل فایل پشتیبان — قبل از هر نوشتنی اجرا می‌شود.
 * ساختار، نسخه و شکل هر مخزن بررسی می‌شود؛ در صورت هر مشکل، بازیابی
 * به‌طور کامل رد می‌شود.
 */
export function validateBackup(parsed: unknown): BackupValidation {
  const fail = (error: string): BackupValidation => ({ ok: false, error });

  if (!isObject(parsed)) return fail("فایل انتخاب‌شده یک JSON معتبر نیست.");
  if (parsed.app !== "nasagh-backup") {
    return fail("این فایل یک نسخهٔ پشتیبان نسق نیست.");
  }
  if (typeof parsed.version !== "number") {
    return fail("نسخهٔ فایل پشتیبان قابل تشخیص نیست.");
  }
  if (parsed.version > BACKUP_FORMAT_VERSION) {
    return fail("نسخهٔ این پشتیبان از نسخهٔ برنامه جدیدتر است و قابل بازیابی نیست.");
  }
  if (!isObject(parsed.stores)) return fail("بخش داده‌های پشتیبان پیدا نشد.");

  const stores = parsed.stores as BackupFile["stores"];

  // دفتر حساب
  if (stores.book !== undefined) {
    if (!isObject(stores.book)) return fail("دادهٔ دفتر حساب (طرف حساب‌ها) نامعتبر است.");
    if (!isArrayOfObjects(stores.book.persons)) return fail("فهرست طرف حساب‌ها نامعتبر است.");
    if (!isArrayOfObjects(stores.book.transactions)) return fail("فهرست تراکنش‌های دفتر حساب نامعتبر است.");
  }

  // انبار
  if (stores.inventory !== undefined) {
    if (!isObject(stores.inventory)) return fail("دادهٔ انبار نامعتبر است.");
    if (!isArrayOfObjects(stores.inventory.products)) return fail("فهرست کالاها نامعتبر است.");
    if (!isArrayOfObjects(stores.inventory.movements)) return fail("فهرست حرکات انبار نامعتبر است.");
  }

  // فاکتورها
  if (stores.invoices !== undefined) {
    if (!isArrayOfObjects(stores.invoices)) return fail("فهرست فاکتورها نامعتبر است.");
    for (const inv of stores.invoices) {
      if (typeof inv.id !== "string" || typeof inv.invoiceNumber !== "string") {
        return fail("یک فاکتور در پشتیبان فیلدهای ضروری (شناسه/شماره) ندارد.");
      }
    }
  }

  // چک‌ها
  if (stores.cheques !== undefined) {
    if (!isObject(stores.cheques)) return fail("دادهٔ چک‌ها نامعتبر است.");
    if (!isArrayOfObjects(stores.cheques.cheques)) return fail("فهرست چک‌ها نامعتبر است.");
    for (const ch of stores.cheques.cheques) {
      if (typeof ch.id !== "string" || typeof ch.amount !== "number") {
        return fail("یک چک در پشتیبان فیلدهای ضروری (شناسه/مبلغ) ندارد.");
      }
    }
  }

  // هزینه‌ها
  if (stores.costs !== undefined) {
    if (!isObject(stores.costs)) return fail("دادهٔ هزینه‌ها نامعتبر است.");
    if (!isArrayOfObjects(stores.costs.costs)) return fail("فهرست هزینه‌ها و درآمدها نامعتبر است.");
  }

  const summary: BackupSummary = {
    version: parsed.version,
    exportedAt: typeof parsed.exportedAt === "string" ? parsed.exportedAt : "",
    appVersion: typeof parsed.appVersion === "string" ? parsed.appVersion : "",
    counts: summarizeStores(stores),
  };

  return { ok: true, summary, file: parsed as unknown as BackupFile };
}

/** خواندن و اعتبارسنجی متن فایل انتخاب‌شده */
export function parseBackupText(text: string): BackupValidation {
  try {
    return validateBackup(JSON.parse(text));
  } catch {
    return { ok: false, error: "فایل انتخاب‌شده یک JSON معتبر نیست." };
  }
}

/* ------------------------------ بازیابی ------------------------------ */

/**
 * جایگزینی کامل مخازن با دادهٔ اعتبارسنجی‌شده و ریلود برنامه.
 * فقط بعد از اعتبارسنجی کامل فراخوانی شود — نوشتن همهٔ کلیدها پشت‌سرهم
 * و سپس ریلود، رفتار تراکنشی (همه یا هیچ) را تضمین می‌کند.
 */
export function restoreBackup(file: BackupFile): void {
  const stores = file.stores;
  const write = (key: string, value: unknown) => {
    if (value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  };
  write(BACKUP_STORE_KEYS.book, stores.book);
  write(BACKUP_STORE_KEYS.inventory, stores.inventory);
  write(BACKUP_STORE_KEYS.invoices, stores.invoices);
  write(BACKUP_STORE_KEYS.cheques, stores.cheques);
  write(BACKUP_STORE_KEYS.costs, stores.costs);
  write(BACKUP_STORE_KEYS.settings, stores.settings);
  if (typeof stores.theme === "string") {
    try {
      localStorage.setItem(BACKUP_STORE_KEYS.theme, stores.theme);
    } catch {
      /* بی‌اثر */
    }
  }
  window.location.reload();
}

/** شکل‌های خالی هر مخزن — برای پاک‌سازی کامل داده‌ها */
function emptyStores() {
  return {
    book: JSON.stringify({ persons: [], transactions: [], notes: [], reminders: [] }),
    inventory: JSON.stringify({ products: [], categories: [], movements: [] }),
    invoices: JSON.stringify([]),
    cheques: JSON.stringify({ cheques: [], reminders: [] }),
    costs: JSON.stringify({ costs: [], categories: [] }),
  };
}

/**
 * پاک‌سازی همهٔ داده‌های کسب‌وکار (تنظیمات حفظ می‌شود) و ریلود.
 * فقط با تأیید قوی کاربر فراخوانی شود.
 */
export function clearAllData(): void {
  const empty = emptyStores();
  localStorage.setItem(BACKUP_STORE_KEYS.book, empty.book);
  localStorage.setItem(BACKUP_STORE_KEYS.inventory, empty.inventory);
  localStorage.setItem(BACKUP_STORE_KEYS.invoices, empty.invoices);
  localStorage.setItem(BACKUP_STORE_KEYS.cheques, empty.cheques);
  localStorage.setItem(BACKUP_STORE_KEYS.costs, empty.costs);
  window.location.reload();
}

/**
 * بازگردانی دادهٔ نمونهٔ منسجم فازهای ۱ تا ۶:
 * کلیدهای داده حذف می‌شوند تا هر استور در بارگذاری بعدی به سراغ سید خود برود.
 */
export function restoreDemoData(): void {
  localStorage.removeItem(BACKUP_STORE_KEYS.book);
  localStorage.removeItem(BACKUP_STORE_KEYS.inventory);
  localStorage.removeItem(BACKUP_STORE_KEYS.invoices);
  localStorage.removeItem(BACKUP_STORE_KEYS.cheques);
  localStorage.removeItem(BACKUP_STORE_KEYS.costs);
  window.location.reload();
}
