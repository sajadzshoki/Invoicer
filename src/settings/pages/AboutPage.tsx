import { Database, HardDrive, Info } from "lucide-react";
import { Alert } from "@/components/ui/Feedback";
import { toFaDigits } from "@/lib/fa";
import { LogoMark } from "@/app/Logo";
import { SettingsLayout } from "../SettingsLayout";
import { APP_PHASE, APP_VERSION } from "../defaults";

/** دربارهٔ نسق (فاز ۷) */
export function AboutPage() {
  return (
    <SettingsLayout title="درباره نسق" subtitle="نسخه و شیوهٔ ذخیرهٔ داده‌ها">
      <div className="settings-form">
        <section className="card settings-card about-card" aria-label="معرفی نسق">
          <LogoMark />
          <h2 className="about-card__name">نسق</h2>
          <p className="about-card__desc">
            نسق یک برنامه مدیریت مالی و حسابداری برای کسب‌وکارهای کوچک است؛
            ساده، سریع و شفاف — با فاکتور، دفتر حساب، انبار، چک، هزینه‌ها و
            گزارش‌ها.
          </p>
          <dl className="about-card__meta">
            <div>
              <dt>نسخه</dt>
              <dd dir="ltr">{toFaDigits(APP_VERSION)}</dd>
            </div>
            <div>
              <dt>فاز جاری</dt>
              <dd>{APP_PHASE} — لایهٔ تنظیمات و پشتیبان‌گیری</dd>
            </div>
          </dl>
        </section>

        <section className="card settings-card" aria-label="ذخیره‌سازی داده‌ها">
          <h2 className="settings-card__title">
            <HardDrive size={18} aria-hidden /> ذخیره‌سازی داده‌ها
          </h2>
          <Alert
            variant="info"
            title="داده‌های محلی"
            description="داده‌های این نسخه به‌صورت محلی روی دستگاه ذخیره می‌شوند. هیچ اتصال به سرور، همگام‌سازی ابری یا حساب کاربری وجود ندارد."
          />
          <ul className="about-list">
            <li>
              <Database size={16} aria-hidden /> از «پشتیبان‌گیری و داده‌ها» می‌توانید نسخهٔ
              پشتیبان بگیرید و بازیابی کنید
            </li>
            <li>
              <Info size={16} aria-hidden /> با پاک‌کردن دادهٔ مرورگر، اطلاعات نسق هم حذف
              می‌شود
            </li>
          </ul>
        </section>
      </div>
    </SettingsLayout>
  );
}
