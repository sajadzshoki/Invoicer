import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, type MouseEvent } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/theme";
import { Avatar } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Choice";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Overlay";
import { initialsOfName } from "@/lib/fa";
import { useAppSettings } from "@/settings/store";
import { getActiveGuard } from "@/settings/navGuard";
import { NAV_DESTINATIONS } from "./navigation";
import { LogoMark } from "./Logo";

/** پوستهٔ اصلی اپ — سایدبار (دسکتاپ) + محتوا + ناوبری پایین (موبایل) */
export function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const settings = useAppSettings();
  const business = settings.business;

  /** مسیر در انتظار — وقتی خروج با تغییر ذخیره‌نشده همراه است */
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  // با تغییر صفحه، اسکرول به بالا برمی‌گردد
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  /**
   * ناوبری با محافظ تغییرات ذخیره‌نشده (فاز ۷):
   * اگر صفحه‌ای تغییر ذخیره‌نشده داشته باشد، خروج تأیید می‌خواهد.
   */
  const handleNavClick = (e: MouseEvent, path: string) => {
    const guard = getActiveGuard();
    if (guard && guard.isDirty()) {
      e.preventDefault();
      setPendingPath(path);
    }
  };

  const displayName = business.ownerName || business.name || "کاربر نسق";
  const displayBusiness = business.name || "کسب‌وکار من";

  return (
    <div className="shell">
      {/* سایدبار — فقط در صفحه‌های بزرگ */}
      <aside className="sidebar">
        <div className="sidebar__brand">
          <LogoMark />
          <div>
            <div className="sidebar__brand-name">نسق</div>
            <div className="sidebar__brand-tag">حسابداری کسب‌وکار</div>
          </div>
        </div>

        <nav className="sidebar__nav" aria-label="ناوبری اصلی">
          {NAV_DESTINATIONS.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                cn("sidebar__item", isActive && "is-active")
              }
              onClick={(e) => handleNavClick(e, item.path)}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__theme-row">
            <span className="sidebar__theme-label">
              {theme === "dark" ? <Moon size={18} aria-hidden /> : <Sun size={18} aria-hidden />}
              حالت تاریک
            </span>
            <Switch
              label=""
              checked={theme === "dark"}
              onChange={toggleTheme}
              aria-label="حالت تاریک"
              style={{ minHeight: 32 }}
            />
          </div>
          {/* پروفایل از اطلاعات کسب‌وکار (تنظیمات) خوانده می‌شود */}
          <button
            type="button"
            className="sidebar__profile"
            onClick={(e) => handleNavClick(e, "/settings/business")}
          >
            <Avatar
              label={initialsOfName(displayName)}
              src={business.logo}
              size="md"
            />
            <span>
              <span className="sidebar__profile-name">{displayName}</span>
              <span className="sidebar__profile-caption" style={{ display: "block" }}>
                {displayBusiness}
              </span>
            </span>
          </button>
        </div>
      </aside>

      {/* محتوای اصلی */}
      <div className="shell-content">
        <Outlet />
      </div>

      {/* ناوبری پایین — فقط در موبایل/تبلت */}
      <nav className="bottomnav" aria-label="ناوبری اصلی">
        {NAV_DESTINATIONS.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              cn("bottomnav__item", isActive && "is-active")
            }
            onClick={(e) => handleNavClick(e, item.path)}
          >
            <span className="bottomnav__icon">{item.icon}</span>
            <span className="bottomnav__label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* تأیید خروج با تغییر ذخیره‌نشده */}
      <Modal
        open={!!pendingPath}
        onClose={() => setPendingPath(null)}
        title="تغییرات ذخیره نشده‌اند"
        description="قبل از رفتن به صفحهٔ دیگر، وضعیت تغییرات این صفحه را مشخص کنید."
        footer={
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setPendingPath(null)}>
              انصراف
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                const path = pendingPath;
                setPendingPath(null);
                if (path) navigate(path);
              }}
            >
              خروج بدون ذخیره
            </Button>
            <Button
              onClick={() => {
                getActiveGuard()?.save();
                const path = pendingPath;
                setPendingPath(null);
                if (path) navigate(path);
              }}
            >
              ذخیره و خروج
            </Button>
          </div>
        }
      />
    </div>
  );
}
