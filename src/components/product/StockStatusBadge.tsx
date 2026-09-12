import { AlertTriangle, PackageCheck, PackageX } from "lucide-react";
import { StatusBadge } from "@/components/ui/Card";
import { STOCK_STATUS_LABEL, type StockStatus } from "@/inventory/helpers";

/** نشان وضعیت موجودی — رنگ + آیکون + متن */
export function StockStatusBadge({
  status,
  size = "md",
}: {
  status: StockStatus;
  size?: "sm" | "md";
}) {
  const cls = size === "sm" ? "status-badge--sm" : undefined;
  const iconSize = size === "sm" ? 12 : 13;

  if (status === "in") {
    return (
      <StatusBadge tone="success" icon={<PackageCheck size={iconSize} aria-hidden />} className={cls}>
        {STOCK_STATUS_LABEL.in}
      </StatusBadge>
    );
  }
  if (status === "low") {
    return (
      <StatusBadge tone="warning" icon={<AlertTriangle size={iconSize} aria-hidden />} className={cls}>
        {STOCK_STATUS_LABEL.low}
      </StatusBadge>
    );
  }
  return (
    <StatusBadge tone="error" icon={<PackageX size={iconSize} aria-hidden />} className={cls}>
      {STOCK_STATUS_LABEL.out}
    </StatusBadge>
  );
}
