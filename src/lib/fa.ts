/**
 * ابزارهای قالب‌بندی فارسی — ارقام، مبالغ و تاریخ
 * همهٔ نمایش‌های عددی اپلیکیشن باید از این توابع عبور کنند.
 */

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** تبدیل ارقام لاتین یک رشته به ارقام فارسی */
export function toFaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/** تبدیل ارقام فارسی/عربی به لاتین (برای پردازش ورودی کاربر) */
export function toEnDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** قالب‌بندی عدد با جداکنندهٔ هزارگان فارسی و ارقام فارسی */
export function faNum(n: number, opts: { decimals?: number } = {}): string {
  const { decimals = 0 } = opts;
  const en = Math.abs(n).toLocaleString("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  });
  const fa = toFaDigits(en).replace(/,/g, "٬").replace(/\./g, "٫");
  return n < 0 ? `−${fa}` : fa;
}

/** قالب‌بندی مبلغ به تومان */
export function faToman(n: number): string {
  return `${faNum(n)} تومان`;
}

/** نمایش فشردهٔ مبلغ برای داشبورد؛ مثل «۸۶٫۴ میلیون تومان» */
export function faTomanCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) {
    return `${faNum(n / 1_000_000_000, { decimals: 1 })} میلیارد تومان`;
  }
  if (abs >= 1_000_000) {
    return `${faNum(n / 1_000_000, { decimals: 1 })} میلیون تومان`;
  }
  return faToman(n);
}

/** تاریخ امروز به هجری شمسی؛ مثل «۱۸ شهریور ۱۴۰۵» */
export function faTodayLong(): string {
  return new Intl.DateTimeFormat("fa-IR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

/** روز هفته و تاریخ به هجری شمسی؛ مثل «سه‌شنبه، ۱۸ شهریور» */
export function faTodayFull(): string {
  return new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

/** ساعت به فارسی؛ مثل «۱۴:۳۰» با ارقام فارسی */
export function faTimeNow(): string {
  return new Intl.DateTimeFormat("fa-IR", {
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
