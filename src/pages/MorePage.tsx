import { useState } from "react";
import {
  BarChart3,
  ChevronLeft,
  FileSignature,
  HelpCircle,
  Info,
  Moon,
  Pencil,
  Repeat,
  Settings,
  Sun,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/app/PageHeader";
import { Avatar } from "@/components/ui/Card";
import { IconButton, Button } from "@/components/ui/Button";
import { ListItem } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Choice";
import { Modal } from "@/components/ui/Overlay";
import { useToast } from "@/components/ui/Toast";
import { useTheme } from "@/lib/theme";

const MODULES = [
  {
    id: "cheques",
    title: "چک‌ها",
    caption: "ثبت و پیگیری چک‌های دریافتی و پرداختی",
    icon: <FileSignature size={20} aria-hidden />,
  },
  {
    id: "cashflow",
    title: "هزینه‌ها و درآمدها",
    caption: "ثبت تراکنش‌های روزانهٔ کسب‌وکار",
    icon: <Repeat size={20} aria-hidden />,
  },
  {
    id: "reports",
    title: "گزارش‌ها",
    caption: "نمودارها و خلاصهٔ عملکرد مالی",
    icon: <BarChart3 size={20} aria-hidden />,
  },
  {
    id: "settings",
    title: "تنظیمات",
    caption: "کسب‌وکار، واحد پول و ترجیحات",
    icon: <Settings size={20} aria-hidden />,
  },
];

export function MorePage() {
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [aboutOpen, setAboutOpen] = useState(false);

  const comingSoon = (title: string) =>
    showToast({
      title: `«${title}» به‌زودی فعال می‌شود`,
      description: "این بخش در فازهای بعدی نسق اضافه خواهد شد.",
      variant: "info",
    });

  return (
    <>
      <PageHeader title="بیشتر" subtitle="بخش‌ها و تنظیمات" />

      <div className="page">
        {/* پروفایل کاربر */}
        <section aria-label="پروفایل">
          <div className="profile-card">
            <Avatar label="م‌ر" size="lg" />
            <div className="profile-card__body">
              <p className="profile-card__name">مریم رضایی</p>
              <p className="profile-card__caption">فروشگاه آرمان · نسخهٔ آزمایشی</p>
            </div>
            <IconButton label="ویرایش پروفایل" tone="filled" onClick={() => comingSoon("ویرایش پروفایل")}>
              <Pencil size={18} aria-hidden />
            </IconButton>
          </div>
        </section>

        {/* ماژول‌های آینده */}
        <section className="page__section" aria-label="بخش‌های بیشتر">
          <div className="more-group">
            <div className="list">
              {MODULES.map((mod) => (
                <ListItem
                  key={mod.id}
                  icon={mod.icon}
                  tintIcon
                  title={mod.title}
                  caption={mod.caption}
                  chevron
                  onClick={() => comingSoon(mod.title)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ترجیحات */}
        <section className="page__section" aria-label="ترجیحات">
          <div className="more-group">
            <div className="list">
              <div className="list-item">
                <span className="list-item__icon list-item__icon--tint" aria-hidden>
                  {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
                </span>
                <span className="list-item__body">
                  <span className="list-item__title">حالت تاریک</span>
                  <span className="list-item__caption">ظاهر اپلیکیشن را تیره می‌کند</span>
                </span>
                <span className="list-item__end">
                  <Switch
                    label=""
                    checked={theme === "dark"}
                    onChange={toggleTheme}
                    aria-label="حالت تاریک"
                    style={{ minHeight: 32 }}
                  />
                </span>
              </div>
              <ListItem
                icon={<HelpCircle size={20} aria-hidden />}
                tintIcon
                title="راهنما و پشتیبانی"
                caption="پرسش‌های پرتکرار و راه‌های ارتباط"
                chevron
                onClick={() => comingSoon("راهنما و پشتیبانی")}
              />
              <ListItem
                icon={<Info size={20} aria-hidden />}
                tintIcon
                title="دربارهٔ نسق"
                caption="نسخهٔ ۰٫۱ — فاز ۱"
                chevron
                onClick={() => setAboutOpen(true)}
              />
            </div>
          </div>
        </section>

        <p style={{ textAlign: "center", marginTop: "var(--space-6)" }}>
          <Link
            to="/design-system"
            className="btn btn--text"
            style={{ display: "inline-flex" }}
          >
            پیش‌نمایش سیستم طراحی
            <ChevronLeft size={16} aria-hidden />
          </Link>
        </p>
      </div>

      <Modal
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        title="دربارهٔ نسق"
        description="حسابداری ساده، سریع و شفاف برای کسب‌وکارهای کوچک ایرانی."
        footer={
          <Button onClick={() => setAboutOpen(false)}>بستن</Button>
        }
      >
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)", lineHeight: "var(--leading-relaxed)" }}>
          شما در حال استفاده از فاز ۱ نسق هستید؛ فونداسیون اپلیکیشن، ناوبری و
          سیستم طراحی. بخش‌های فاکتور، چک، گزارش و سایر ماژول‌ها در فازهای بعدی
          اضافه می‌شوند.
        </p>
      </Modal>
    </>
  );
}
