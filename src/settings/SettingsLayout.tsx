import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/app/PageHeader";
import { SETTINGS_ENTRIES } from "./registry";

/**
 * چیدمان صفحه‌های تنظیمات (فاز ۷)
 * دسکتاپ: ناوبری کناری تنظیمات + پنل محتوا با پهنای خوانا
 * موبایل: فهرست گروه‌ها فقط از صفحهٔ اصلی تنظیمات؛ محتوا تمام‌عرض
 */
export function SettingsLayout({
  title,
  subtitle,
  actions,
  onBack,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onBack?: () => void;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleBack = onBack ?? (() => navigate("/settings"));

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} onBack={handleBack} actions={actions} />
      <div className="page settings-layout">
        <nav className="settings-nav" aria-label="بخش‌های تنظیمات">
          {SETTINGS_ENTRIES
            .filter((entry) => entry.id !== "payments")
            .map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={cn(
                  "settings-nav__item",
                  pathname === entry.path && "is-active"
                )}
                onClick={() => navigate(entry.path)}
              >
                {entry.icon}
                {entry.title}
              </button>
            ))}
        </nav>
        <div className="settings-content">{children}</div>
      </div>
    </>
  );
}
