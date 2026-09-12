import { Monitor, Moon, Sun } from "lucide-react";
import { SegmentedControl } from "@/components/ui/Tabs";
import { Alert } from "@/components/ui/Feedback";
import { ListItem } from "@/components/ui/Card";
import { useTheme, type ThemePreference } from "@/lib/theme";
import { SettingsLayout } from "../SettingsLayout";

/**
 * ظاهر برنامه (فاز ۷)
 * از همان سیستم تم موجود استفاده می‌کند (سیستم تم دوم ساخته نمی‌شود) و
 * ترجیح کاربر ذخیره می‌شود. زبان انگلیسی در این فاز هنوز پشتیبانی نمی‌شود.
 */
export function AppearanceSettingsPage() {
  const { preference, setPreference } = useTheme();

  return (
    <SettingsLayout title="ظاهر برنامه" subtitle="تم و زبان">
      <div className="settings-form">
        <section className="card settings-card" aria-label="تم برنامه">
          <h2 className="settings-card__title">تم برنامه</h2>
          <SegmentedControl
            items={[
              { id: "light", label: "روشن" },
              { id: "dark", label: "تاریک" },
              { id: "system", label: "سیستم" },
            ]}
            active={preference}
            onChange={(id) => setPreference(id as ThemePreference)}
            ariaLabel="تم برنامه"
            block
          />
          <ul className="about-list" aria-label="توضیح گزینه‌ها">
            <li>
              <Sun size={16} aria-hidden /> روشن — همیشه تم روشن
            </li>
            <li>
              <Moon size={16} aria-hidden /> تاریک — همیشه تم تاریک
            </li>
            <li>
              <Monitor size={16} aria-hidden /> سیستم — پیروی از تنظیم دستگاه و تغییر
              خودکار با آن
            </li>
          </ul>
        </section>

        <section className="card settings-card" aria-label="زبان">
          <h2 className="settings-card__title">زبان</h2>
          <ListItem
            title="فارسی"
            caption="زبان اصلی برنامه — راست‌به‌چپ"
            end={<span className="settings-check">پیش‌فرض</span>}
          />
          <ListItem
            title="English"
            caption="در فاز بعد فعال می‌شود"
            className="list-item--muted"
            end={<span className="settings-check">غیرفعال</span>}
          />
          <Alert
            variant="info"
            title="چرا هنوز فعال نیست؟"
            description="ترجمهٔ ناقص و ناسازگار ارائه نمی‌شود؛ پشتیبانی کامل انگلیسی در فاز بعدی اضافه می‌شود."
          />
        </section>
      </div>
    </SettingsLayout>
  );
}
