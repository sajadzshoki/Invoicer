import { faNum } from "@/lib/fa";
import { sharePercent } from "@/reports/calculations/aggregate";

/**
 * نمودار دونات — برای سهم دسته‌ها
 * رنگ به‌تنهایی معیار نیست: راهنما با نام، مبلغ و درصد کنارش می‌آید.
 */

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  slices: DonutSlice[];
  ariaLabel: string;
  /** مقدار مرکز — معمولاً جمع کل */
  centerLabel: string;
  centerValue: string;
  formatValue?: (value: number) => string;
}

export function DonutChart({
  slices,
  ariaLabel,
  centerLabel,
  centerValue,
  formatValue = faNum,
}: DonutChartProps) {
  const total = slices.reduce((s, slice) => s + slice.value, 0);
  const size = 168;
  const r = 62;
  const stroke = 26;
  const c = 2 * Math.PI * r;

  let offset = 0;
  const arcs = slices
    .filter((s) => s.value > 0)
    .map((slice, i) => {
      const frac = total > 0 ? slice.value / total : 0;
      const dash = frac * c;
      const arc = {
        key: `${slice.label}-${i}`,
        slice,
        dash,
        offset,
      };
      offset += dash;
      return arc;
    });

  return (
    <div className="donut">
      <div className="donut__figure" dir="ltr">
        <svg
          role="img"
          aria-label={ariaLabel}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            className="donut__track"
          />
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={arc.slice.color}
              strokeWidth={stroke}
              strokeDasharray={`${arc.dash} ${c - arc.dash}`}
              strokeDashoffset={-arc.offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              className="donut__arc"
            >
              <title>{`${arc.slice.label}: ${formatValue(arc.slice.value)} (${faNum(
                sharePercent(arc.slice.value, total)
              )}٪)`}</title>
            </circle>
          ))}
          <text x="50%" y="46%" textAnchor="middle" className="donut__center-label">
            {centerLabel}
          </text>
          <text x="50%" y="58%" textAnchor="middle" className="donut__center-value">
            {centerValue}
          </text>
        </svg>
      </div>
      <ul className="donut__legend" aria-label="راهنمای نمودار">
        {arcs.map((arc) => (
          <li key={arc.key} className="donut__legend-item">
            <span
              className="donut__legend-swatch"
              style={{ background: arc.slice.color }}
              aria-hidden
            />
            <span className="donut__legend-label">{arc.slice.label}</span>
            <span className="donut__legend-value">
              {formatValue(arc.slice.value)}
              <span className="donut__legend-percent">
                {faNum(sharePercent(arc.slice.value, total))}٪
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
