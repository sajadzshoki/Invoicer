import { useState, type ReactNode } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  LoaderCircle,
  WifiOff,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";

/* ------------------------------ هشدار ------------------------------ */

export type AlertVariant = "info" | "success" | "warning" | "error";

export interface AlertProps {
  variant?: AlertVariant;
  title: string;
  description?: ReactNode;
  onClose?: () => void;
  className?: string;
}

const ALERT_ICON: Record<AlertVariant, ReactNode> = {
  info: <Info size={20} aria-hidden />,
  success: <CheckCircle2 size={20} aria-hidden />,
  warning: <AlertTriangle size={20} aria-hidden />,
  error: <AlertCircle size={20} aria-hidden />,
};

export function Alert({ variant = "info", title, description, onClose, className }: AlertProps) {
  return (
    <div className={cn("alert", `alert--${variant}`, className)} role="alert">
      <span className="alert__icon">{ALERT_ICON[variant]}</span>
      <div className="alert__body">
        <p className="alert__title">{title}</p>
        {description && <p className="alert__desc">{description}</p>}
      </div>
      {onClose && <CloseableAlert onClose={onClose} />}
    </div>
  );
}

function CloseableAlert({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="alert__close"
      aria-label="بستن هشدار"
      onClick={onClose}
    >
      <X size={16} aria-hidden />
    </button>
  );
}

/** هشدار قابل‌بستن با مدیریت وضعیت داخلی */
export function DismissibleAlert(props: Omit<AlertProps, "onClose">) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return <Alert {...props} onClose={() => setOpen(false)} />;
}

/* ------------------------------ وضعیت خالی ------------------------------ */

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  /** اکشن اصلی و ثانویه */
  actions?: ReactNode;
  compact?: boolean;
  className?: string;
}

/** وضعیت خالی — برای تجربهٔ اولین استفاده */
export function EmptyState({
  icon,
  title,
  description,
  actions,
  compact,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("empty-state", compact && "empty-state--compact", className)}>
      <div className="empty-state__icon" aria-hidden>
        {icon}
      </div>
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__desc">{description}</p>}
      {actions && <div className="empty-state__actions">{actions}</div>}
    </div>
  );
}

/* ------------------------------ وضعیت خطا ------------------------------ */

export interface ErrorStateProps {
  title?: string;
  description?: string;
  /** دکمهٔ تلاش دوباره */
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/** وضعیت خطا — با آیکون پیش‌فرض قطع ارتباط */
export function ErrorState({
  title = "مشکلی پیش آمد",
  description = "اتصال را بررسی کنید و دوباره تلاش کنید.",
  action,
  icon,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("empty-state error-state", className)}>
      <div className="empty-state__icon" aria-hidden>
        {icon ?? <WifiOff size={30} />}
      </div>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__desc">{description}</p>
      {action && <div className="empty-state__actions">{action}</div>}
    </div>
  );
}

/* ------------------------------ بارگذاری ------------------------------ */

export interface LoadingStateProps {
  label?: string;
  size?: number;
}

/** حالت بارگذاری مرکزی */
export function LoadingState({ label = "در حال بارگذاری…", size = 28 }: LoadingStateProps) {
  return (
    <div className="loading-block" role="status">
      <LoaderCircle size={size} className="spinner" aria-hidden />
      {label && <span>{label}</span>}
    </div>
  );
}

/** اسپینر کوچک داخل دکمه‌ها و کنترل‌ها */
export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return <LoaderCircle size={size} className={cn("spinner", className)} aria-hidden />;
}

/* ------------------------------ اسکلت ------------------------------ */

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  circle?: boolean;
  className?: string;
}

/** اسکلت بارگذاری — برای حفظ ساختار صفحه هنگام دریافت داده */
export function Skeleton({ width, height = 14, circle, className }: SkeletonProps) {
  return (
    <span
      className={cn("skeleton", circle && "skeleton--circle", className)}
      style={{ width, height }}
      aria-hidden
    />
  );
}

/** اسکلت یک آیتم لیست (آواتار + دو خط) */
export function SkeletonListItem() {
  return (
    <div className="list-item" aria-hidden>
      <Skeleton circle width={42} height={42} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <Skeleton width="45%" height={14} />
        <Skeleton width="70%" height={11} />
      </div>
      <Skeleton width={56} height={22} />
    </div>
  );
}
