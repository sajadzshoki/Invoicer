import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/theme";
import { Avatar } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Choice";
import { NAV_DESTINATIONS } from "./navigation";
import { LogoMark } from "./Logo";

const CURRENT_USER = {
  name: "مریم رضایی",
  initials: "م‌ر",
  business: "فروشگاه آرمان",
};

/** پوستهٔ اصلی اپ — سایدبار (دسکتاپ) + محتوا + ناوبری پایین (موبایل) */
export function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  // با تغییر صفحه، اسکرول به بالا برمی‌گردد
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

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
          <button type="button" className="sidebar__profile">
            <Avatar label={CURRENT_USER.initials} size="md" />
            <span>
              <span className="sidebar__profile-name">{CURRENT_USER.name}</span>
              <span className="sidebar__profile-caption" style={{ display: "block" }}>
                {CURRENT_USER.business}
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
          >
            <span className="bottomnav__icon">{item.icon}</span>
            <span className="bottomnav__label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
