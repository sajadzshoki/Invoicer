import { useMemo } from "react";
import { faNum } from "@/lib/fa";
import type { DualTimePoint } from "@/reports/calculations/aggregate";

/**
 * نمودار ستونی دوتایی (مثل درآمد در برابر هزینه) — SVG خالص
 */

export interface DualColumnChartProps {
  points: DualTimePoint[];
  ariaLabel: string;
  labelA: string;
  labelB: string;
  colorA?: string;
  colorB?: string;
  formatValue?: (value: number) => string;
  height?: number;
}

export function DualColumnChart({
  points,
  ariaLabel,
  labelA,
  labelB,
  colorA = "var(--fin-income)",
  colorB = "var(--fin-expense)",
  formatValue = faNum,
  height = 170,
}: DualColumnChartProps) {
  const max = Math.max(1, ...points.flatMap((p) => [p.a, p.b]));

  const slot = 52;
  const barW = 16;
  const width = Math.max(points.length * slot, slot) + 16;
  const topPad = 14;
  const bottomPad = 24;
  const chartH = height - topPad - bottomPad;

  const labelStep = useMemo(() => {
    const target = Math.min(points.length, 8);
    return Math.max(1, Math.ceil(points.length / target));
  }, [points.length]);

  return (
    <div>
      <div className="chart-legend" role="list" aria-label="راهنمای نمودار">
        <span className="chart-legend__item" role="listitem">
          <span className="chart-legend__swatch" style={{ background: colorA }} aria-hidden />
          {labelA}
        </span>
        <span className="chart-legend__item" role="listitem">
          <span className="chart-legend__swatch" style={{ background: colorB }} aria-hidden />
          {labelB}
        </span>
      </div>
      <div className="chart-scroll" dir="ltr">
        <svg
          role="img"
          aria-label={ariaLabel}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="column-chart"
        >
          <line
            x1={0}
            x2={width}
            y1={topPad + chartH}
            y2={topPad + chartH}
            className="column-chart__axis"
          />
          {points.map((p, i) => {
            const x0 = 8 + i * slot + (slot - barW * 2 - 6) / 2;
            const hA = p.a > 0 ? Math.max(2, Math.round((p.a / max) * chartH)) : 0;
            const hB = p.b > 0 ? Math.max(2, Math.round((p.b / max) * chartH)) : 0;
            const showLabel = i % labelStep === 0;
            return (
              <g key={p.key}>
                {p.a > 0 && (
                  <rect
                    x={x0}
                    y={topPad + chartH - hA}
                    width={barW}
                    height={hA}
                    rx={4}
                    fill={colorA}
                    className="column-chart__bar"
                    tabIndex={0}
                  >
                    <title>{`${p.label} — ${labelA}: ${formatValue(p.a)}`}</title>
                  </rect>
                )}
                {p.b > 0 && (
                  <rect
                    x={x0 + barW + 6}
                    y={topPad + chartH - hB}
                    width={barW}
                    height={hB}
                    rx={4}
                    fill={colorB}
                    className="column-chart__bar"
                    tabIndex={0}
                  >
                    <title>{`${p.label} — ${labelB}: ${formatValue(p.b)}`}</title>
                  </rect>
                )}
                {showLabel && (
                  <text
                    x={x0 + barW + 3}
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
      </div>
      <span className="visually-hidden">{ariaLabel}</span>
    </div>
  );
}
