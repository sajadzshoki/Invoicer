import { SegmentedControl } from "@/components/ui/Tabs";
import { Switch } from "@/components/ui/Choice";
import { Alert } from "@/components/ui/Feedback";
import { Field } from "@/components/ui/Field";
import { faToman, faTodayLong } from "@/lib/fa";
import { SettingsLayout } from "../SettingsLayout";
import { useSettings } from "../store";
import type { CurrencyUnit, DateSystem, DigitStyle } from "../types";

/**
 * مالی و نمایش مبالغ (فاز ۷)
 * این تنظیمات فقط «نمایش» را تغییر می‌دهند: مقادیر ذخیره‌شده همیشه به
 * تومان باقی می‌مانند و هرگز به‌صورت پنهان تبدیل نمی‌شوند. در حالت ریال،
 * نمایش به‌صورت صریح «مبلغ × ۱۰» با برچسب ریال است.
 */
export function FinancialSettingsPage() {
  const { settings, update } = useSettings();
  const financial = settings.financial;

  return (
    <SettingsLayout title="مالی و نمایش مبالغ" subtitle="واحد پول، ارقام و تاریخ">
      <div className="settings-form">
        <section className="card settings-card" aria-label="واحد پول">
          <h2 className="settings-card__title">واحد پول</h2>
          <SegmentedControl
            items={[
              { id: "TOMAN", label: "تومان" },
              { id: "RIAL", label: "ریال" },
            ]}
            active={financial.currency}
            onChange={(id) =>
              update((prev) => ({
                ...prev,
                financial: { ...prev.financial, currency: id as CurrencyUnit },
              }))
            }
            ariaLabel="واحد پول"
            block
          />
          <Alert
            variant="info"
            title="مقادیر ذخیره‌شده تبدیل نمی‌شوند"
            description="اعداد داخلی همیشه به تومان می‌مانند؛ در حالت ریال فقط نمایش به‌صورت صریح ده برابر با برچسب ریال است."
          />
          <p className="settings-preview" aria-live="polite">
            نمونهٔ نمایش: <strong>{faToman(1_250_000)}</strong>
          </p>
        </section>

        <section className="card settings-card" aria-label="نمایش اعداد">
          <h2 className="settings-card__title">نمایش اعداد</h2>
          <Field label="شیوهٔ نمایش ارقام">
            <SegmentedControl
              items={[
                { id: "fa", label: "ارقام فارسی" },
                { id: "en", label: "ارقام لاتین" },
              ]}
              active={financial.digits}
              onChange={(id) =>
                update((prev) => ({
                  ...prev,
                  financial: { ...prev.financial, digits: id as DigitStyle },
                }))
              }
              ariaLabel="شیوه نمایش ارقام"
              block
            />
          </Field>
          <div className="list-item">
            <span className="list-item__body">
              <span className="list-item__title">جداکنندهٔ هزارگان</span>
              <span className="list-item__caption">نمایش سه‌رقم‌سه‌رقم در مبالغ</span>
            </span>
            <span className="list-item__end">
              <Switch
                label="جداکنندهٔ هزارگان"
                checked={financial.thousandSeparator}
                onChange={(e) =>
                  update((prev) => ({
                    ...prev,
                    financial: { ...prev.financial, thousandSeparator: e.target.checked },
                  }))
                }
              />
            </span>
          </div>
        </section>

        <section className="card settings-card" aria-label="نمایش تاریخ">
          <h2 className="settings-card__title">نمایش تاریخ</h2>
          <SegmentedControl
            items={[
              { id: "jalali", label: "جلالی" },
              { id: "gregorian", label: "میلادی" },
            ]}
            active={financial.dateSystem}
            onChange={(id) =>
              update((prev) => ({
                ...prev,
                financial: { ...prev.financial, dateSystem: id as DateSystem },
              }))
            }
            ariaLabel="نظام نمایش تاریخ"
            block
          />
          <p className="settings-preview" aria-live="polite">
            نمونهٔ نمایش امروز: <strong>{faTodayLong()}</strong>
          </p>
          <Alert
            variant="info"
            title="ذخیرهٔ داخلی تغییر نمی‌کند"
            description="تاریخ‌ها همیشه به‌صورت استاندارد ذخیره می‌مانند و فقط نمایش آن‌ها عوض می‌شود؛ انتخابگرهای تاریخ همان تجربهٔ جلالی را حفظ کرده‌اند."
          />
        </section>
      </div>
    </SettingsLayout>
  );
}

