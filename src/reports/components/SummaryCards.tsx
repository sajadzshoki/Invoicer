import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/cn";

/**
 * کارت‌های خلاصهٔ گزارش‌ها — قابل کلیک برای رفتن به گزارش مربوطه
 */

export type MetricTone =
  | "primary"
  | "income"
  | "expense"
  | "receivable"
  | "debt"
  | "neutral";

export interface SummaryMetric {
  id: string;
  label: string;
  value: string;
  caption?: string;
  tone?: MetricTone;
  /** مسیر گزارش مقصد برای کلیک */
  to?: string;
}

export interface SummaryCardsProps {
  metrics: SummaryMetric[];
  ariaLabel: string;
}

export function SummaryCards({ metrics, ariaLabel }: SummaryCardsProps) {
  const navigate = useNavigate();

  return (
    <div className="metric-grid" role="list" aria-label={ariaLabel}>
      {metrics.map((metric) => {
        const clickable = !!metric.to;
        return (
          <button
            key={metric.id}
            type="button"
            role="listitem"
            className={cn("metric-card", !clickable && "metric-card--static")}
            onClick={clickable ? () => navigate(metric.to!) : undefined}
            aria-label={
              clickable
                ? `${metric.label}: ${metric.value} — رفتن به گزارش`
                : undefined
            }
          >
            <span
              className={cn("metric-card__bar", `metric-card__bar--${metric.tone ?? "neutral"}`)}
              aria-hidden
            />
            <span className="metric-card__label">{metric.label}</span>
            <strong className="metric-card__value">{metric.value}</strong>
            {metric.caption && (
              <span className="metric-card__caption">{metric.caption}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
