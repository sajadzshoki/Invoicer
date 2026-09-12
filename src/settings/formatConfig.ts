/**
 * پیکربندی نمایش (فاز ۷)
 *
 * توابع قالب‌بندی (ارقام، مبالغ، تاریخ) ماژول‌های خالص هستند و به ری‌اکت
 * دسترسی ندارند؛ این ماژول «پل» تنظیمات نمایش را به‌صورت هم‌زمان در
 * اختیار آن‌ها می‌گذارد. مقدار اولیه در لحظهٔ بارگذاری ماژول از
 * localStorage خوانده می‌شود تا اولین رندر هم درست قالب‌بندی شود و
 * با هر تغییر تنظیمات، توسط استور تنظیمات به‌روز می‌شود.
 *
 * نکتهٔ مهم: این پیکربندی فقط «نمایش» را تغییر می‌دهد؛ مقادیر ذخیره‌شدهٔ
 * مالی همیشه به تومان باقی می‌مانند و هرگز پنهانی تبدیل نمی‌شوند.
 */

import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from "./defaults";
import type { CurrencyUnit, DateSystem, DigitStyle } from "./types";

export interface FormatConfig {
  currency: CurrencyUnit;
  digits: DigitStyle;
  dateSystem: DateSystem;
  thousandSeparator: boolean;
  /** هشدار کم‌بودن موجودی فعال است؟ */
  lowStockWarning: boolean;
}

function fromDefaults(): FormatConfig {
  return {
    currency: DEFAULT_SETTINGS.financial.currency,
    digits: DEFAULT_SETTINGS.financial.digits,
    dateSystem: DEFAULT_SETTINGS.financial.dateSystem,
    thousandSeparator: DEFAULT_SETTINGS.financial.thousandSeparator,
    lowStockWarning: DEFAULT_SETTINGS.inventory.lowStockWarning,
  };
}

function readInitial(): FormatConfig {
  const cfg = fromDefaults();
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return cfg;
    const parsed = JSON.parse(raw) as {
      financial?: Partial<FormatConfig>;
      inventory?: { lowStockWarning?: boolean };
    };
    if (parsed.financial) {
      if (parsed.financial.currency === "TOMAN" || parsed.financial.currency === "RIAL") {
        cfg.currency = parsed.financial.currency;
      }
      if (parsed.financial.digits === "fa" || parsed.financial.digits === "en") {
        cfg.digits = parsed.financial.digits;
      }
      if (
        parsed.financial.dateSystem === "jalali" ||
        parsed.financial.dateSystem === "gregorian"
      ) {
        cfg.dateSystem = parsed.financial.dateSystem;
      }
      if (typeof parsed.financial.thousandSeparator === "boolean") {
        cfg.thousandSeparator = parsed.financial.thousandSeparator;
      }
    }
    if (typeof parsed.inventory?.lowStockWarning === "boolean") {
      cfg.lowStockWarning = parsed.inventory.lowStockWarning;
    }
  } catch {
    /* خرابی حافظه نباید نمایش را متوقف کند */
  }
  return cfg;
}

let current: FormatConfig =
  typeof localStorage !== "undefined" ? readInitial() : fromDefaults();

export function getFormatConfig(): FormatConfig {
  return current;
}

/** اعمال پیکربندی تازه توسط استور تنظیمات */
export function applyFormatConfig(next: Partial<FormatConfig>): void {
  current = { ...current, ...next };
}

/** برچسب واحد پول جاری: تومان یا ریال */
export function currencyLabel(): string {
  return current.currency === "RIAL" ? "ریال" : "تومان";
}

/**
 * تبدیل صریح مبلغ ذخیره‌شده (تومان) به واحد نمایش انتخاب‌شده.
 * تنها نقطهٔ تبدیل در کل اپ — هیچ تبدیل پنهان دیگری وجود ندارد.
 */
export function toDisplayAmount(tomanAmount: number): number {
  return current.currency === "RIAL" ? tomanAmount * 10 : tomanAmount;
}
