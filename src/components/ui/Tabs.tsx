import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { faNum } from "@/lib/fa";

export interface TabItem {
  id: string;
  label: ReactNode;
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
  className?: string;
}

/** تب‌های زیرخطی — مناسب صفحه‌های لیست */
export function Tabs({ tabs, active, onChange, ariaLabel, className }: TabsProps) {
  return (
    <div className={cn("tabs", className)} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            disabled={tab.disabled}
            className={cn("tabs__tab", isActive && "is-active")}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
            {typeof tab.count === "number" && (
              <span className="tabs__count">{faNum(tab.count)}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface SegmentedItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  items: SegmentedItem[];
  active: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
  block?: boolean;
  className?: string;
}

/** سگمنتد کنترل — برای انتخاب بین دو یا چند حالت محدود */
export function SegmentedControl({
  items,
  active,
  onChange,
  ariaLabel,
  block,
  className,
}: SegmentedControlProps) {
  return (
    <div
      className={cn("segmented", block && "segmented--block", className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={item.disabled}
            className={cn("segmented__item", isActive && "is-active")}
            onClick={() => onChange(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
