/**
 * ابزارهای تقویم جلالی (هجری شمسی)
 * الگوریتم تبدیل بر اساس jalaali-js (MIT) پیاده‌سازی شده است.
 * این ماژول برای انتخاب تاریخ در فاز ۲ و فازهای بعدی استفاده می‌شود.
 *
 * فاز ۷: نمایش تاریخ‌ها (faDateLong) نظام تقویم انتخابی را رعایت می‌کند؛
 * انتخابگرهای تاریخ همان تجربهٔ جلالی‌محور را حفظ کرده‌اند و تاریخ‌های
 * ذخیره‌شده همیشه ISO میلادی باقی می‌مانند.
 */

import { dateLocale, toFaDigits } from "./fa";
import { getFormatConfig } from "@/settings/formatConfig";

export interface JDate {
  jy: number;
  jm: number;
  jd: number;
}

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

/* تقسیم به‌سمت صفر — دقیقاً مانند ~~ در jalaali-js (floor نیست!) */
function div(a: number, b: number): number {
  return Math.trunc(a / b);
}
function mod(a: number, b: number): number {
  return a - Math.trunc(a / b) * b;
}

function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
    2192, 2262, 2324, 2394, 2456, 3178,
  ];
  const bl = breaks.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jump = 0;

  for (let i = 1; i < bl; i += 1) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  const n = jy - jp;

  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) {
    const n2 = n - jump + div(jump + 4, 33) * 33;
    let leap = mod(mod(n2 + 1, 33) - 1, 4);
    if (leap === -1) leap = 4;
    return { leap, gy, march };
  }
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

export function isLeapJalali(jy: number): boolean {
  return jalCal(jy).leap === 0;
}

export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalali(jy) ? 30 : 29;
}

/*
 * توابع تبدیل، معادل کتابخانهٔ مرجع jalaali-js (MIT).
 * نکتهٔ حیاتی (اصلاح فاز ۷): این الگوریتم با تقسیم «به‌سمت صفر» (trunc)
 * کار می‌کند نه «به‌سمت پایین» (floor)؛ برای عددهای منفی نتیجه متفاوت است
 * و استفاده از floor تبدیل تاریخ را خراب می‌کند.
 */
function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn: number): JDate {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let jd, jm, k;
  k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) {
      jm = 1 + div(k, 31);
      jd = mod(k, 31) + 1;
      return { jy, jm, jd };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  jm = 7 + div(k, 30);
  jd = mod(k, 30) + 1;
  return { jy, jm, jd };
}

/** تبدیل میلادی به جلالی */
export function gregorianToJalali(gy: number, gm: number, gd: number): JDate {
  return d2j(g2d(gy, gm, gd));
}

/** تبدیل جلالی به میلادی */
export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  return d2g(j2d(jy, jm, jd));
}

/** تاریخ جلالی امروز */
export function todayJalali(): JDate {
  const now = new Date();
  return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** آیا تاریخ جلالی معتبر است؟ */
export function isValidJalali(j: JDate): boolean {
  if (!Number.isInteger(j.jy) || !Number.isInteger(j.jm) || !Number.isInteger(j.jd)) return false;
  if (j.jy < 1300 || j.jy > 1500) return false;
  if (j.jm < 1 || j.jm > 12) return false;
  if (j.jd < 1 || j.jd > jalaliMonthLength(j.jy, j.jm)) return false;
  return true;
}

/**
 * تبدیل جلالی به شیء Date میلادی (نیمه‌شب محلی)
 */
export function jalaliToDate(j: JDate): Date {
  const { gy, gm, gd } = jalaliToGregorian(j.jy, j.jm, j.jd);
  return new Date(gy, gm - 1, gd);
}

/** تبدیل ISO (YYYY-MM-DD) به جلالی */
export function isoToJalali(iso: string): JDate | null {
  const [gy, gm, gd] = iso.split("-").map(Number);
  if (!gy || !gm || !gd) return null;
  return gregorianToJalali(gy, gm, gd);
}

/** تبدیل جلالی به ISO (YYYY-MM-DD) */
export function jalaliToIso(j: JDate): string {
  const { gy, gm, gd } = jalaliToGregorian(j.jy, j.jm, j.jd);
  const mm = String(gm).padStart(2, "0");
  const dd = String(gd).padStart(2, "0");
  return `${gy}-${mm}-${dd}`;
}

const FA_DIGITS_MAP: Record<string, string> = {
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

function toLatinDigits(s: string): string {
  return s.replace(/[۰-۹٠-٩]/g, (d) => FA_DIGITS_MAP[d] ?? d);
}

/**
 * تحلیل رشتهٔ تاریخ جلالی مثل «۱۴۰۵/۰۶/۱۸» یا «1405-6-18»
 * در صورت نامعتبر بودن، دلیل خطا برمی‌گردد.
 */
export function parseJalaliString(
  raw: string
): { ok: true; date: JDate } | { ok: false; error: string } {
  const s = toLatinDigits(raw).trim();
  if (!s) return { ok: false, error: "تاریخ را وارد کنید." };
  const parts = s.split(/[/-]/).map((p) => Number(p.trim()));
  if (parts.length !== 3 || parts.some((p) => !Number.isInteger(p))) {
    return { ok: false, error: "قالب تاریخ معتبر نیست؛ مثل ۱۴۰۵/۰۶/۱۸" };
  }
  const [jy, jm, jd] = parts;
  const date = { jy, jm, jd };
  if (jy < 1300 || jy > 1500) {
    return { ok: false, error: "سال واردشده معتبر نیست." };
  }
  if (jm < 1 || jm > 12) {
    return { ok: false, error: "ماه باید بین ۱ تا ۱۲ باشد." };
  }
  if (jd < 1 || jd > jalaliMonthLength(jy, jm)) {
    return { ok: false, error: `روز واردشده برای ${JALALI_MONTHS[jm - 1]} معتبر نیست.` };
  }
  return { ok: true, date };
}

/** قالب‌بندی جلالی بلند؛ مثل «۱۸ شهریور ۱۴۰۵» */
export function formatJalaliLong(j: JDate): string {
  return `${toFaDigits(j.jd)} ${JALALI_MONTHS[j.jm - 1]} ${toFaDigits(j.jy)}`;
}

/** قالب‌بندی کوتاه جلالی؛ مثل «۱۴۰۵/۰۶/۱۸» */
export function formatJalaliShort(j: JDate): string {
  const mm = String(j.jm).padStart(2, "0");
  const dd = String(j.jd).padStart(2, "0");
  return toFaDigits(`${j.jy}/${mm}/${dd}`);
}

/**
 * نمایش ISO مطابق نظام تقویم انتخابی (فاز ۷):
 * جلالی → «۱۸ شهریور ۱۴۰۵» | میلادی → «۱۲ سپتامبر ۲۰۲۶»
 * تاریخ‌های ذخیره‌شده همیشه ISO میلادی می‌مانند و فقط نمایش تغییر می‌کند.
 */
export function faDateLong(iso: string): string {
  const cfg = getFormatConfig();
  if (cfg.dateSystem === "gregorian") {
    const d = isoToDate(iso);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat(dateLocale(), {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  }
  const j = isoToJalali(iso);
  if (!j) return "";
  return formatJalaliLong(j);
}

/** تبدیل ISO (YYYY-MM-DD) به شیء Date محلی */
export function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** نمایش نسبی تاریخ برای لیست‌ها و تاریخچه */
export function relativeFaDate(iso: string, opts: { future?: boolean } = {}): string {
  const target = isoToDate(iso);
  const now = new Date();
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const days = Math.round((a.getTime() - b.getTime()) / 86_400_000);

  if (days === 0) return "امروز";
  if (!opts.future) {
    if (days === 1) return "دیروز";
    if (days === 2) return "پریروز";
    if (days > 2 && days <= 7) {
      return `${toFaDigits(days)} روز پیش`;
    }
  } else {
    if (days === -1) return "فردا";
    if (days < -1 && days >= -7) {
      return `${toFaDigits(-days)} روز دیگر`;
    }
  }
  return faDateLong(iso);
}

/** ISO امروز */
export function todayIso(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${mm}-${dd}`;
}

/** ISO n روز پیش */
export function daysAgoIso(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** ISO از روی Date */
export function isoFromDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** مقایسهٔ دو ISO برای مرتب‌سازی */
export function compareIsoDesc(a: string, b: string): number {
  return b.localeCompare(a);
}
