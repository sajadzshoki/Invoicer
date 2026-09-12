import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * مرز خطای سراسری (فاز ۸)
 *
 * اگر خطای رندر غیرمنتظره‌ای در هر بخشی از اپ رخ دهد، به‌جای سفیدشدن
 * کامل صفحه، یک پیام فارسی قابل‌فهم با دکمهٔ بارگذاری دوباره نمایش داده
 * می‌شود. جزئیات فنی برای توسعه فقط در کنسول ثبت می‌شود و داده‌های
 * کاربر (حافظهٔ محلی) هرگز توسط این مرز دست‌کاری نمی‌شوند.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    // جزئیات فنی فقط برای توسعه در کنسول می‌ماند
    console.error("خطای غیرمنتظره در نسق:", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="page" style={{ paddingBlock: "var(--space-8)" }}>
          <div className="card" style={{ padding: "var(--space-6)", textAlign: "center" }}>
            <h2 style={{ marginBottom: "var(--space-2)" }}>مشکلی پیش آمد</h2>
            <p style={{ color: "var(--color-text-2)", marginBottom: "var(--space-4)" }}>
              یک خطای غیرمنتظره رخ داد. داده‌های شما روی همین دستگاه ذخیره شده‌اند و
              با بارگذاری دوبارهٔ برنامه در دسترس می‌مانند.
            </p>
            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={() => window.location.reload()}
            >
              بارگذاری دوبارهٔ برنامه
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
