/**
 * موتور بازهٔ تاریخ گزارش‌ها (فاز ۶)
 *
 * همهٔ گزارش‌ها تاریخ‌ها را به‌صورت ISO میلادی (YYYY-MM-DD) مقایسه می‌کنند؛
 * رابط کاربری و برچسب‌ها جلالی هستند. بازه‌ها «شامل هر دو سر» هستند.
 * این ماژول تنها نقطهٔ محاسبهٔ بازه است تا منطق فیلتر تاریخ تکرار نشود.
 */

import {
  JALALI_MONTHS,
  isoFromDate,
  isoToJalali,
  jalaliMonthLength,
  jalaliToIso,
  todayIso,
  todayJalali,
} from "@/lib/jalali";

export type ReportRangePreset =
  | "today"
  | "week"
  | "month"
  | "lastMonth"
  | "last3Months"
  | "year"
  | "custom";

export const REPORT_RANGE_LABEL: Record<ReportRangePreset, string> = {
  today: "امروز",
  week: "این هفته",
  month: "این ماه",
  lastMonth: "ماه قبل",
  last3Months: "سه ماه اخیر",
  year: "امسال",
  custom: "بازه دلخواه",
};

/** ترتیب نمایش پیش‌تنظیم‌ها در انتخابگر */
export const REPORT_RANGE_PRESETS: ReportRangePreset[] = [
  "today",
  "week",
  "month",
  "lastMonth",
  "last3Months",
  "year",
  "custom",
];

export interface ReportRange {
  /** ISO شامل */
  from: string;
  /** ISO شامل */
  to: string;
}

/** شروع هفتهٔ جلالی (شنبه) */
export function startOfWeekIso(): string {
  const d = new Date();
  const daysSinceSaturday = (d.getDay() + 1) % 7;
  d.setDate(d.getDate() - daysSinceSaturday);
  return isoFromDate(d);
}

/** شروع ماه جلالی جاری */
export function startOfCurrentJalaliMonthIso(): string {
  const j = todayJalali();
  return jalaliToIso({ jy: j.jy, jm: j.jm, jd: 1 });
}

/** جابه‌جایی ماه جلالی با رعایت سال */
function shiftJalaliMonth(jy: number, jm: number, delta: number): { jy: number; jm: number } {
  let total = jy * 12 + (jm - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return { jy: ny, jm: nm };
}

/** بازهٔ کامل یک ماه جلالی */
function jalaliMonthRange(jy: number, jm: number): ReportRange {
  return {
    from: jalaliToIso({ jy, jm, jd: 1 }),
    to: jalaliToIso({ jy, jm, jd: jalaliMonthLength(jy, jm) }),
  };
}

/**
 * تبدیل پیش‌تنظیم به بازهٔ مشخص.
 * برای «بازه دلخواه» بازهٔ ورودی استفاده می‌شود و در نبود آن، ماه جاری.
 */
export function resolveReportRange(
  preset: ReportRangePreset,
  custom?: ReportRange
): ReportRange {
  const today = todayIso();
  const j = todayJalali();
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "week":
      return { from: startOfWeekIso(), to: today };
    case "month":
      return { from: startOfCurrentJalaliMonthIso(), to: today };
    case "lastMonth": {
      const prev = shiftJalaliMonth(j.jy, j.jm, -1);
      return jalaliMonthRange(prev.jy, prev.jm);
    }
    case "last3Months": {
      const start = shiftJalaliMonth(j.jy, j.jm, -2);
      return {
        from: jalaliToIso({ jy: start.jy, jm: start.jm, jd: 1 }),
        to: today,
      };
    }
    case "year":
      return {
        from: jalaliToIso({ jy: j.jy, jm: 1, jd: 1 }),
        to: today,
      };
    case "custom":
      return custom && custom.from && custom.to
        ? { from: minIso(custom.from, custom.to), to: maxIso(custom.from, custom.to) }
        : { from: startOfCurrentJalaliMonthIso(), to: today };
  }
}

function minIso(a: string, b: string): string {
  return a <= b ? a : b;
}

function maxIso(a: string, b: string): string {
  return a >= b ? a : b;
}

/** آیا تاریخ ISO داخل بازه است؟ (شامل دو سر) */
export function inRange(iso: string, range: ReportRange): boolean {
  return iso >= range.from && iso <= range.to;
}

/** برچسب فارسی بازه برای سربرگ گزارش و چاپ */
export function formatReportRange(range: ReportRange): string {
  const fromJ = isoToJalali(range.from);
  const toJ = isoToJalali(range.to);
  if (!fromJ || !toJ) return "";
  const fa = (s: string | number) =>
    String(s).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
  const fromStr = `${fa(fromJ.jd)} ${JALALI_MONTHS[fromJ.jm - 1]} ${fa(fromJ.jy)}`;
  const toStr = `${fa(toJ.jd)} ${JALALI_MONTHS[toJ.jm - 1]} ${fa(toJ.jy)}`;
  if (fromStr === toStr) return fromStr;
  return `از ${fromStr} تا ${toStr}`;
}

/** تعداد روزهای بین دو ISO (برای برچسب سررسید چک‌ها) */
export function diffDays(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split("-").map(Number);
  const [ty, tm, td] = toIso.split("-").map(Number);
  const a = Date.UTC(fy, fm - 1, fd);
  const b = Date.UTC(ty, tm - 1, td);
  return Math.round((b - a) / 86_400_000);
}
