import { useMemo } from "react";
import { faNum } from "@/lib/fa";
import type { TimePoint } from "@/reports/calculations/aggregate";

/**
 * نمودار ستونی سری زمانی — SVG خالص بدون وابستگی
 * - با دادهٔ خالی در والد (ChartCard) مدیریت می‌شود
 * - با یک نقطه هم درست کار می‌کند
 * - رنگ‌ها از توکن‌های تم می‌آیند؛ برچسب و مقدار جایگزین رنگ هستند
 */

export interface ColumnChartProps {
  points: TimePoint[];
  ariaLabel: string;
  /** قالب‌بندی مقدار برای تولتیپ — پیش‌فرض عدد فارسی */
  formatValue?: (value: number) => string;
  /** رنگ ستون‌ها — پیش‌فرض رنگ اصلی تم */
  color?: string;
  height?: number;
}

export function ColumnChart({
  points,
  ariaLabel,
  formatValue = faNum,
  color = "var(--color-primary)",
  height = 150,
}: ColumnChartProps) {
  const nonZero = points.filter((p) => p.value > 0);
  const max = Math.max(1, ...points.map((p) => p.value));

  // عرض هر ستون و فاصله — برای یک ستون هم درست است
  const slot = 30;
  const width = Math.max(points.length * slot, slot) + 16;
  const barW = 16;
  const topPad = 14;
  const bottomPad = 24;
  const chartH = height - topPad - bottomPad;

  const labelStep = useMemo(() => {
    const target = Math.min(points.length, 8);
    return Math.max(1, Math.ceil(points.length / target));
  }, [points.length]);

  return (
    <div className="chart-scroll" dir="ltr">
      <svg
        role="img"
        aria-label={ariaLabel}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="column-chart"
      >
        {/* خط پایه و خط میانی */}
        <line
          x1={0}
          x2={width}
          y1={topPad + chartH}
          y2={topPad + chartH}
          className="column-chart__axis"
        />
        <line
          x1={0}
          x2={width}
          y1={topPad + chartH / 2}
          y2={topPad + chartH / 2}
          className="column-chart__grid"
        />
        <text
          x={width - 2}
          y={topPad + chartH / 2 - 3}
          textAnchor="end"
          className="column-chart__tick"
        >
          {formatValue(Math.round(max / 2))}
        </text>
        <text x={width - 2} y={topPad - 3} textAnchor="end" className="column-chart__tick">
          {formatValue(max)}
        </text>

        {points.map((p, i) => {
          const barH = p.value > 0 ? Math.max(2, Math.round((p.value / max) * chartH)) : 0;
          const x = 8 + i * slot + (slot - barW) / 2;
          const y = topPad + chartH - barH;
          const showLabel = i % labelStep === 0;
          return (
            <g key={p.key}>
              {p.value > 0 && (
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={4}
                  fill={color}
                  className="column-chart__bar"
                  tabIndex={0}
                >
                  <title>{`${p.label}: ${formatValue(p.value)}${
                    p.count > 0 ? ` (${faNum(p.count)} رکورد)` : ""
                  }`}</title>
                </rect>
              )}
              {showLabel && (
                <text
                  x={x + barW / 2}
                  y={height - 8}
                  textAnchor="middle"
                  className="column-chart__label"
                >
                  {p.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <span className="visually-hidden">
        {`${ariaLabel} — ${nonZero.length} نقطهٔ غیرصفر`}
      </span>
    </div>
  );
}
