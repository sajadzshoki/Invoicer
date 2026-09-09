import type { ReactNode } from "react";
import { ChartColumnBig } from "lucide-react";
import { EmptyState } from "@/components/ui/Feedback";

export interface ChartCardProps {
  title: string;
  /** راهنمای کوتاه زیر عنوان */
  caption?: string;
  /** آیا داده‌ای برای نمایش هست؟ */
  hasData: boolean;
  /** متن حالت خالی */
  emptyText?: string;
  children: ReactNode;
  className?: string;
}

/** قاب استاندارد نمودار — عنوان + حالت خالی + محتوا */
export function ChartCard({
  title,
  caption,
  hasData,
  emptyText = "داده کافی برای نمایش نمودار وجود ندارد.",
  children,
  className,
}: ChartCardProps) {
  return (
    <div className={`chart-card${className ? ` ${className}` : ""}`}>
      <div className="chart-card__head">
        <h3 className="chart-card__title">{title}</h3>
        {caption && <p className="chart-card__caption">{caption}</p>}
      </div>
      {hasData ? (
        children
      ) : (
        <EmptyState
          compact
          icon={<ChartColumnBig size={26} aria-hidden />}
          title="نموداری نیست"
          description={emptyText}
        />
      )}
    </div>
  );
}
