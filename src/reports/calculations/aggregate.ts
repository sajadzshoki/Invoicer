import { isoToJalali, JALALI_MONTHS, todayIso } from "@/lib/jalali";
import { diffDays, type ReportRange } from "@/reports/dateRange/range";

/**
 * محاسبات تجمیعی خالص برای گزارش‌ها — بدون وابستگی به مخازن
 */

export interface TimePoint {
  /** برچسب جلالی برای محور */
  label: string;
  /** کلید مرتب‌سازی (ISO یا سال-ماه) */
  key: string;
  value: number;
  /** تعداد رکوردهای تشکیل‌دهنده */
  count: number;
}

export interface SeriesInput {
  date: string;
  amount: number;
}

/**
 * سری زمانی روی بازهٔ گزارش:
 * - بازه‌های کوتاه (تا ۶۲ روز) → سطل روزانه
 * - بازه‌های بلندتر → سطل ماه جلالی
 */
export function timeSeries(
  items: SeriesInput[],
  range: ReportRange
): TimePoint[] {
  const span = diffDays(range.from, range.to) + 1;
  return span <= 62
    ? dailySeries(items, range)
    : monthlySeries(items, range);
}

function faDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

function dailySeries(items: SeriesInput[], range: ReportRange): TimePoint[] {
  const map = new Map<string, { value: number; count: number }>();
  for (const item of items) {
    const entry = map.get(item.date) ?? { value: 0, count: 0 };
    entry.value += item.amount;
    entry.count += 1;
    map.set(item.date, entry);
  }

  const points: TimePoint[] = [];
  const [fy, fm, fd] = range.from.split("-").map(Number);
  const cursor = new Date(fy, fm - 1, fd);
  const end = range.to;
  while (true) {
    const mm = String(cursor.getMonth() + 1).padStart(2, "0");
    const dd = String(cursor.getDate()).padStart(2, "0");
    const key = `${cursor.getFullYear()}-${mm}-${dd}`;
    if (key > end) break;
    const entry = map.get(key);
    const j = isoToJalali(key);
    points.push({
      key,
      label: j ? `${faDigits(String(j.jd))} ${JALALI_MONTHS[j.jm - 1]}` : key,
      value: entry?.value ?? 0,
      count: entry?.count ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return points;
}

function monthlySeries(items: SeriesInput[], range: ReportRange): TimePoint[] {
  const fromJ = isoToJalali(range.from);
  const toJ = isoToJalali(range.to);
  if (!fromJ || !toJ) return [];

  const map = new Map<string, { value: number; count: number }>();
  for (const item of items) {
    const j = isoToJalali(item.date);
    if (!j) continue;
    const key = `${j.jy}-${String(j.jm).padStart(2, "0")}`;
    const entry = map.get(key) ?? { value: 0, count: 0 };
    entry.value += item.amount;
    entry.count += 1;
    map.set(key, entry);
  }

  const points: TimePoint[] = [];
  let jy = fromJ.jy;
  let jm = fromJ.jm;
  while (jy < toJ.jy || (jy === toJ.jy && jm <= toJ.jm)) {
    const key = `${jy}-${String(jm).padStart(2, "0")}`;
    const entry = map.get(key);
    points.push({
      key,
      label: `${JALALI_MONTHS[jm - 1]} ${faDigits(String(jy))}`,
      value: entry?.value ?? 0,
      count: entry?.count ?? 0,
    });
    jm += 1;
    if (jm > 12) {
      jm = 1;
      jy += 1;
    }
  }
  return points;
}

/* ------------------------------ تجمیع برچسبی ------------------------------ */

export interface LabeledSum {
  label: string;
  value: number;
  count: number;
}

/** جمع‌کردن مقادیر بر اساس برچسب و مرتب‌سازی نزولی */
export function sumByLabel(
  items: Array<{ label: string; amount: number }>,
  limit?: number
): LabeledSum[] {
  const map = new Map<string, LabeledSum>();
  for (const item of items) {
    const entry = map.get(item.label) ?? { label: item.label, value: 0, count: 0 };
    entry.value += item.amount;
    entry.count += 1;
    map.set(item.label, entry);
  }
  const list = [...map.values()].sort((a, b) => b.value - a.value);
  return limit ? list.slice(0, limit) : list;
}

/* ------------------------------ مقایسهٔ دو سری ------------------------------ */

export interface DualTimePoint {
  label: string;
  key: string;
  a: number;
  b: number;
}

/** دو سری زمانی هم‌محور (مثل درآمد/هزینه) روی یک بازه */
export function dualTimeSeries(
  aItems: SeriesInput[],
  bItems: SeriesInput[],
  range: ReportRange
): DualTimePoint[] {
  const a = timeSeries(aItems, range);
  const bMap = new Map(timeSeries(bItems, range).map((p) => [p.key, p.value]));
  return a.map((p) => ({
    label: p.label,
    key: p.key,
    a: p.value,
    b: bMap.get(p.key) ?? 0,
  }));
}

/* ------------------------------ میانگین و درصد ------------------------------ */

export function average(total: number, count: number): number {
  return count > 0 ? Math.round(total / count) : 0;
}

/** درصد سهم یک مقدار از کل — برای دونات و فهرست‌ها */
export function sharePercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

/** تفاوت روز با امروز (برای سررسید چک) — مثبت یعنی آینده */
export function daysFromToday(iso: string): number {
  return diffDays(todayIso(), iso);
}
