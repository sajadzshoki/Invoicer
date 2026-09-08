import { ArrowDownToLine, ArrowUpFromLine, BadgeCheck } from "lucide-react";
import { StatusBadge } from "@/components/ui/Card";
import { STATUS_LABEL } from "@/book/finance";
import type { PartyStatus } from "@/book/types";

/**
 * نشان وضعیت مالی طرف حساب — رنگ + آیکون + متن؛
 * هیچ وضعیت فقط با رنگ منتقل نمی‌شود.
 */
export function PartyStatusBadge({
  status,
  size = "md",
}: {
  status: PartyStatus;
  size?: "sm" | "md";
}) {
  if (status === "debtor") {
    return (
      <StatusBadge
        tone="info"
        icon={<ArrowDownToLine size={size === "sm" ? 12 : 13} aria-hidden />}
        className={size === "sm" ? "status-badge--sm" : undefined}
      >
        {STATUS_LABEL.debtor}
      </StatusBadge>
    );
  }
  if (status === "creditor") {
    return (
      <StatusBadge
        tone="warning"
        icon={<ArrowUpFromLine size={size === "sm" ? 12 : 13} aria-hidden />}
        className={size === "sm" ? "status-badge--sm" : undefined}
      >
        {STATUS_LABEL.creditor}
      </StatusBadge>
    );
  }
  return (
    <StatusBadge
      tone="success"
      icon={<BadgeCheck size={size === "sm" ? 12 : 13} aria-hidden />}
      className={size === "sm" ? "status-badge--sm" : undefined}
    >
      {STATUS_LABEL.settled}
    </StatusBadge>
  );
}
