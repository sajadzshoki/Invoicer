/**
 * پالت رنگ نمودارها — توکن‌ها در reports.css برای هر دو تم تعریف می‌شوند.
 * رنگ هرگز تنها معیار تمایز نیست؛ برچسب و مقدار همیشه همراهش هست.
 */
export const CHART_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

export function paletteColor(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}
