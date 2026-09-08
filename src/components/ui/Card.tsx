import type { HTMLAttributes, ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";

/* ------------------------------ کارت ------------------------------ */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** بدون سایه — برای سطوح داخل کارت یا فرم‌ها */
  flat?: boolean;
  interactive?: boolean;
}

export function Card({ flat, interactive, className, children, onClick, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "card",
        flat && "card--flat",
        (interactive || onClick) && "card--interactive",
        className
      )}
      onClick={onClick}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card__header">
      <div>
        <h3 className="card__title">{title}</h3>
        {subtitle && <p className="card__subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------ آیتم لیست ------------------------------ */

export interface ListItemProps {
  icon?: ReactNode;
  /** آیکون با پس‌زمینهٔ رنگی برند */
  tintIcon?: boolean;
  /** آواتار به‌جای آیکون — برای آیتم‌های شخص/حساب */
  avatar?: ReactNode;
  title: ReactNode;
  caption?: ReactNode;
  end?: ReactNode;
  /** نمایش فلش رفتن — جهت فلش در RTL به سمت چپ است */
  chevron?: boolean;
  onClick?: () => void;
  className?: string;
}

/** آیتم لیست — با آیکون، عنوان، توضیح و بخش انتهایی */
export function ListItem({
  icon,
  tintIcon,
  avatar,
  title,
  caption,
  end,
  chevron,
  onClick,
  className,
}: ListItemProps) {
  const content = (
    <>
      {avatar ?? (
        icon && (
          <span
            className={cn("list-item__icon", tintIcon && "list-item__icon--tint")}
            aria-hidden
          >
            {icon}
          </span>
        )
      )}
      <span className="list-item__body">
        <span className="list-item__title">{title}</span>
        {caption && <span className="list-item__caption">{caption}</span>}
      </span>
      {(end || chevron) && (
        <span className="list-item__end">
          {end}
          {chevron && (
            <ChevronLeft size={20} className="list-item__chevron" aria-hidden />
          )}
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={cn("list-item list-item--interactive", className)}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }
  return <div className={cn("list-item", className)}>{content}</div>;
}

/* ------------------------------ جداکننده ------------------------------ */

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("divider", className)} />;
}

export function DividerLabel({ children }: { children: ReactNode }) {
  return <div className="divider-label">{children}</div>;
}

/* ------------------------------ آواتار ------------------------------ */

export interface AvatarProps {
  /** متن اولیه (مثل «م‌ر») وقتی تصویر نداریم */
  label: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ label, src, size = "md", className }: AvatarProps) {
  return (
    <span className={cn("avatar", `avatar--${size}`, className)} aria-hidden>
      {src ? <img src={src} alt="" /> : label}
    </span>
  );
}

/* ------------------------------ نشان‌ها ------------------------------ */

export type BadgeTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "outline";

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

/** نشان سادهٔ بدون نقطه — برای دسته‌بندی و شمارش */
export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return <span className={cn("badge", `badge--${tone}`, className)}>{children}</span>;
}

export interface StatusBadgeProps {
  tone: "success" | "warning" | "error" | "info" | "neutral";
  children: ReactNode;
  /** آیکون به‌جای نقطه — وضعیت هیچ‌وقت فقط با رنگ منتقل نمی‌شود */
  icon?: ReactNode;
  className?: string;
}

/** نشان وضعیت مالی/عملیاتی — نقطه یا آیکون + متن */
export function StatusBadge({ tone, children, icon, className }: StatusBadgeProps) {
  return (
    <span className={cn("status-badge", `status-badge--${tone}`, className)}>
      {icon ?? <span className="status-badge__dot" aria-hidden />}
      {children}
    </span>
  );
}
