import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { IconButton } from "@/components/ui/Button";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** نمایش دکمهٔ بازگشت — در RTL فلش به سمت راست است */
  onBack?: boolean | (() => void);
  actions?: ReactNode;
}

/** هدر بالای صفحه: عنوان، دکمهٔ بازگشت اختیاری و اکشن‌های زمینه‌ای */
export function PageHeader({ title, subtitle, onBack, actions }: PageHeaderProps) {
  const navigate = useNavigate();
  const handleBack = () => {
    if (typeof onBack === "function") onBack();
    else navigate(-1);
  };

  return (
    <header className="appbar">
      {onBack && (
        <IconButton label="بازگشت" onClick={handleBack}>
          <ArrowRight size={22} aria-hidden />
        </IconButton>
      )}
      <div className="appbar__titles">
        <h1 className="appbar__title">{title}</h1>
        {subtitle && <p className="appbar__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="appbar__actions">{actions}</div>}
    </header>
  );
}
