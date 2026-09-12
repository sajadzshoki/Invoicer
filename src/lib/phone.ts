import { toEnDigits, toFaDigits } from "./fa";

/** نرمال‌سازی شمارهٔ تلفن: حذف فاصله/خط‌تیره و تبدیل ارقام فارسی به لاتین */
export function normalizePhone(raw: string): string {
  return toEnDigits(raw).replace(/[\s\-()]/g, "");
}

/** اعتبارسنجی پایهٔ شمارهٔ موبایل/ثابت ایران */
export function isValidIranianPhone(raw: string): boolean {
  const p = normalizePhone(raw);
  if (!p) return false;
  // موبایل: ۰۹…، ‎+989… یا ۹… | ثابت: ۸ تا ۱۱ رقم
  const mobile = /^(\+98|0098|0)?9\d{9}$/.test(p);
  const landline = /^\d{8,11}$/.test(p);
  return mobile || landline;
}

/** نمایش خوانای شماره با ارقام فارسی؛ مثل «۰۹۱۲ ۳۴۵ ۶۷۸۹» */
export function formatPhoneDisplay(raw: string): string {
  const p = normalizePhone(raw);
  if (!p) return "";
  let display = p;
  if (p.startsWith("+98")) display = "۰" + p.slice(3).replace(/^0+/, "");
  else if (p.startsWith("0098")) display = "۰" + p.slice(4).replace(/^0+/, "");
  const fa = toFaDigits(display);
  if (fa.length === 11) {
    return `${fa.slice(0, 4)} ${fa.slice(4, 7)} ${fa.slice(7)}`;
  }
  return fa;
}
