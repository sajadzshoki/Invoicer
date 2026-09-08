import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "destructive"
  | "text";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  /** حالت در حال بارگذاری — اسپینر جایگزین آیکون می‌شود */
  loading?: boolean;
  /** تمام‌عرض */
  block?: boolean;
  icon?: ReactNode;
  iconEnd?: ReactNode;
}

/**
 * دکمهٔ اصلی اپلیکیشن.
 * همهٔ حالت‌ها (پیش‌فرض/هاور/فشرده/فوکوس/غیرفعال/بارگذاری) در استایل تعریف شده‌اند.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      block = false,
      icon,
      iconEnd,
      className,
      children,
      disabled,
      type,
      onClick,
      ...rest
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={cn(
          "btn",
          `btn--${variant}`,
          size !== "md" && `btn--${size}`,
          block && "btn--block",
          loading && "is-loading",
          className
        )}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        onClick={loading ? undefined : onClick}
        {...rest}
      >
        {loading ? (
          <LoaderCircle size={18} className="btn__spinner" aria-hidden />
        ) : (
          icon
        )}
        {children}
        {!loading && iconEnd}
      </button>
    );
  }
);

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** برچسب دسترس‌پذیری — اجباری چون دکمه متن مرئی ندارد */
  label: string;
  size?: "sm" | "md";
  tone?: "default" | "filled" | "tint";
}

/** دکمهٔ فقط‌آیکونی با برچسب دسترس‌پذیری اجباری */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { label, size = "md", tone = "default", className, children, type, ...rest },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        aria-label={label}
        title={undefined}
        className={cn(
          "icon-btn",
          size === "sm" && "icon-btn--sm",
          tone === "filled" && "icon-btn--filled",
          tone === "tint" && "icon-btn--tint",
          className
        )}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
