/**
 * ابزارهای قالب‌بندی فارسی — ارقام، مبالغ و تاریخ
 * همهٔ نمایش‌های عددی اپلیکیشن باید از این توابع عبور کنند.
 *
 * فاز ۷: این توابع به «پیکربندی نمایش» تنظیمات وصل هستند:
 * - واحد پول (تومان/ریال) فقط در نمایش اثر دارد؛ مقادیر ذخیره‌شده همیشه
 *   به تومان‌اند و تبدیل تنها به‌صورت صریح در toDisplayAmount انجام می‌شود.
 * - ارقام فارسی/لاتین و جداکنندهٔ هزارگان از تنظیمات خوانده می‌شوند.
 */

import {
  currencyLabel,
  getFormatConfig,
  toDisplayAmount,
} from "@/settings/formatConfig";

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** تبدیل ارقام لاتین یک رشته به ارقام فارسی (در حالت ارقام لاتین، بدون تغییر) */
export function toFaDigits(input: string | number): string {
  const s = String(input);
  if (getFormatConfig().digits === "en") return s;
  return s.replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/** تبدیل ارقام فارسی/عربی به لاتین (برای پردازش ورودی کاربر) */
export function toEnDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** لوکیل نمایش تاریخ بر اساس تنظیمات (نظام تقویم + شیوهٔ ارقام) */
export function dateLocale(): string {
  const cfg = getFormatConfig();
  const calendar = cfg.dateSystem === "gregorian" ? "gregory" : "persian";
  const base = cfg.digits === "fa" ? "fa-IR" : "en-GB";
  return `${base}-u-ca-${calendar}`;
}

/** قالب‌بندی عدد با جداکنندهٔ هزارگان و ارقام مطابق تنظیمات */
export function faNum(n: number, opts: { decimals?: number } = {}): string {
  const { decimals = 0 } = opts;
  const cfg = getFormatConfig();
  const en = Math.abs(n).toLocaleString("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
    useGrouping: cfg.thousandSeparator,
  });
  if (cfg.digits === "en") {
    return n < 0 ? `-${en}` : en;
  }
  const fa = toFaDigits(en).replace(/,/g, "٬").replace(/\./g, "٫");
  return n < 0 ? `−${fa}` : fa;
}

/** واحد پول انتخابی به‌صورت متن؛ تومان یا ریال */
export function currencyUnitLabel(): string {
  return currencyLabel();
}

/** رقم مبلغ در واحد نمایش (تومان یا ریال) بدون برچسب — برای جدول‌ها */
export function faMoney(n: number): string {
  return faNum(toDisplayAmount(n));
}

/** قالب‌بندی مبلغ با واحد پول انتخابی — مقادیر ورودی همیشه به تومان‌اند */
export function faToman(n: number): string {
  return `${faMoney(n)} ${currencyLabel()}`;
}

/** نمایش فشردهٔ مبلغ برای داشبورد؛ مثل «۸۶٫۴ میلیون تومان» */
export function faTomanCompact(n: number): string {
  const display = toDisplayAmount(n);
  const label = currencyLabel();
  const abs = Math.abs(display);
  if (abs >= 1_000_000_000) {
    return `${faNum(display / 1_000_000_000, { decimals: 1 })} میلیارد ${label}`;
  }
  if (abs >= 1_000_000) {
    return `${faNum(display / 1_000_000, { decimals: 1 })} میلیون ${label}`;
  }
  return faToman(n);
}

/** تاریخ امروز مطابق نظام تقویم انتخابی؛ مثل «۱۸ شهریور ۱۴۰۵» */
export function faTodayLong(): string {
  return new Intl.DateTimeFormat(dateLocale(), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

/** روز هفته و تاریخ مطابق تنظیمات؛ مثل «سه‌شنبه، ۱۸ شهریور» */
export function faTodayFull(): string {
  return new Intl.DateTimeFormat(dateLocale(), {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

/** ساعت با ارقام مطابق تنظیمات؛ مثل «۱۴:۳۰» */
export function faTimeNow(): string {
  const locale = getFormatConfig().digits === "fa" ? "fa-IR" : "en-GB";
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

/** سلام بر اساس زمان روز */
export function faGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "صبح بخیر";
  if (h >= 12 && h < 17) return "ظهر بخیر";
  if (h >= 17 && h < 21) return "عصر بخیر";
  return "شب بخیر";
}

/**
 * گرفتن رقم از ورودی کاربر (فارسی/لاتین) و قالب‌بندی زنده با جداکنندهٔ هزارگان.
 * برای «ورودی مبلغ» استفاده می‌شود.
 */
export function formatAmountInput(raw: string): string {
  const digits = toEnDigits(raw).replace(/\D/g, "").slice(0, 15);
  if (!digits) return "";
  return faNum(Number(digits));
}

/** رقم خالصِ یک رشتهٔ مبلغِ قالب‌بندی‌شده */
export function parseAmountDigits(formatted: string): string {
  return toEnDigits(formatted).replace(/\D/g, "");
}

/** حروف ابتدای نام برای آواتار؛ مثل «م‌ر» برای «مریم رضایی» */
export function initialsOfName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0]}‌${parts[1][0]}`;
}
