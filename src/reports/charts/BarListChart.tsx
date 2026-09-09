import { faNum } from "@/lib/fa";
import type { LabeledSum } from "@/reports/calculations/aggregate";

/**
 * فهرست میله‌ای افقی — برای تفکیک دسته/کالا
 * برچسب + عدد همیشه کنار میله هست؛ پس رنگ تنها معیار تمایز نیست.
 */

export interface BarListChartProps {
  items: LabeledSum[];
  ariaLabel: string;
  /** رنگ میله‌ها — پیش‌فرض رنگ اصلی تم */
  color?: string;
  formatValue?: (value: number) => string;
  /** حداکثر تعداد ردیف */
  limit?: number;
}

export function BarListChart({
  items,
  ariaLabel,
  color = "var(--color-primary)",
  formatValue = faNum,
  limit,
}: BarListChartProps) {
  const list = limit ? items.slice(0, limit) : items;
  const max = Math.max(1, ...list.map((i) => i.value));

  return (
    <div className="bar-list" role="list" aria-label={ariaLabel}>
      {list.map((item) => {
        const percent = Math.max(2, Math.round((item.value / max) * 100));
        return (
          <div key={item.label} className="bar-list__row" role="listitem">
            <span className="bar-list__label" title={item.label}>
              {item.label}
            </span>
            <span className="bar-list__track" aria-hidden>
              <span
                className="bar-list__fill"
                style={{ width: `${percent}%`, background: color }}
              />
            </span>
            <span className="bar-list__value">{formatValue(item.value)}</span>
          </div>
        );
      })}
    </div>
  );
}
