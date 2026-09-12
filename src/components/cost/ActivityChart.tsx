import { useMemo } from "react";
import type { RegisterCost } from "@/costs/types";
import { faToman } from "@/lib/fa";

export interface ActivityChartProps {
  costs: RegisterCost[];
}

interface WeekBucket {
  label: string;
  income: number;
  expense: number;
}

const WEEKS = 8;

/** نمودار فعالیت: مقایسهٔ درآمد و هزینه در هفته‌های اخیر (SVG خالص، بدون کتابخانه) */
export function ActivityChart({ costs }: ActivityChartProps) {
  const weeks = useMemo<WeekBucket[]>(() => {
    const buckets: WeekBucket[] = [];
    const now = new Date();
    for (let i = WEEKS - 1; i >= 0; i--) {
      buckets.push({
        label: i === 0 ? "این هفته" : i === 1 ? "هفتهٔ قبل" : `${i} هفته پیش`,
        income: 0,
        expense: 0,
      });
    }
    for (const cost of costs) {
      const day = Math.floor((now.getTime() - new Date(cost.date + "T00:00:00").getTime()) / 86_400_000);
      const idx = Math.floor(day / 7);
      if (idx < 0 || idx >= WEEKS) continue;
      const bucket = buckets[WEEKS - 1 - idx];
      if (cost.type === "INCOME") bucket.income += cost.amount;
      else bucket.expense += cost.amount;
    }
    return buckets;
  }, [costs]);

  const max = useMemo(
    () => Math.max(1, ...weeks.flatMap((w) => [w.income, w.expense])),
    [weeks]
  );

  const hasData = weeks.some((w) => w.income > 0 || w.expense > 0);

  // هندسهٔ نمودار
  const chartH = 120;
  const gapWeek = 14;
  const barW = 16;
  const pairW = barW * 2 + 6;
  const weekW = pairW + gapWeek;
  const width = WEEKS * weekW + gapWeek;

  return (
    <div className="activity-chart">
      <div className="activity-chart__legend">
        <span className="activity-chart__legend-item">
          <span className="activity-chart__dot activity-chart__dot--income" aria-hidden />
          درآمد
        </span>
        <span className="activity-chart__legend-item">
          <span className="activity-chart__dot activity-chart__dot--expense" aria-hidden />
          هزینه
        </span>
        <span className="activity-chart__range">هفته‌های اخیر</span>
      </div>

      {!hasData ? (
        <p className="activity-chart__empty">هنوز رکوردی در هفته‌های اخیر ثبت نشده است.</p>
      ) : (
        <div className="activity-chart__scroll" dir="ltr">
          <svg
            role="img"
            aria-label="نمودار درآمد و هزینهٔ هفته‌های اخیر"
            width={width}
            height={chartH + 26}
            viewBox={`0 0 ${width} ${chartH + 26}`}
          >
            {/* خط پایه */}
            <line
              x1={0}
              x2={width}
              y1={chartH}
              y2={chartH}
              stroke="var(--color-border)"
              strokeWidth={1}
            />
            {weeks.map((w, i) => {
              const x = gapWeek + i * weekW;
              const incomeH = Math.round((w.income / max) * (chartH - 12));
              const expenseH = Math.round((w.expense / max) * (chartH - 12));
              return (
                <g key={i}>
                  {w.income > 0 && (
                    <rect
                      x={x}
                      y={chartH - incomeH}
                      width={barW}
                      height={incomeH}
                      rx={4}
                      fill="var(--color-success)"
                    >
                      <title>{`درآمد: ${faToman(w.income)}`}</title>
                    </rect>
                  )}
                  {w.expense > 0 && (
                    <rect
                      x={x + barW + 6}
                      y={chartH - expenseH}
                      width={barW}
                      height={expenseH}
                      rx={4}
                      fill="var(--color-error)"
                    >
                      <title>{`هزینه: ${faToman(w.expense)}`}</title>
                    </rect>
                  )}
                  {i === WEEKS - 1 && (
                    <text
                      x={x + pairW / 2}
                      y={chartH + 18}
                      textAnchor="middle"
                      fontSize={10}
                      fill="var(--color-text-3)"
                    >
                      این هفته
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}
      {/* برای دسترسی‌پذیری: مقادیر هفتهٔ جاری در متن خوانا */}
      <p className="activity-chart__caption">
        {`این هفته — درآمد: ${faToman(weeks[WEEKS - 1].income)} · هزینه: ${faToman(weeks[WEEKS - 1].expense)}`}
      </p>
    </div>
  );
}
