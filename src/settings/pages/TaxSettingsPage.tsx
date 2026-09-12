import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomSheet } from "@/components/ui/Overlay";
import { Field, Input } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Choice";
import { Alert } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { faNum, parseAmountDigits, toFaDigits, toEnDigits } from "@/lib/fa";
import { SettingsLayout } from "../SettingsLayout";
import { SaveBar } from "../SaveBar";
import { useSettings } from "../store";
import { useUnsavedChanges } from "../useUnsavedChanges";

const RATE_SUGGESTIONS = [0, 5, 9, 10];

/**
 * تنظیمات مالیات (فاز ۷)
 * فقط «پیش‌فرض» فاکتورهای جدید را تعیین می‌کند؛ فاکتورهای موجود با نرخ
 * ثبت‌شدهٔ خودشان باقی می‌مانند و هرگز بازنویسی نمی‌شوند.
 */
export function TaxSettingsPage() {
  const navigate = useNavigate();
  const { settings, update } = useSettings();
  const { showToast } = useToast();

  const [enabled, setEnabled] = useState(settings.tax.enabled);
  const [rate, setRate] = useState(String(settings.tax.rate));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [leaveSheetOpen, setLeaveSheetOpen] = useState(false);

  const dirty = useMemo(
    () =>
      enabled !== settings.tax.enabled ||
      Number(parseAmountDigits(rate) || "0") !== settings.tax.rate,
    [enabled, rate, settings.tax]
  );

  const save = () => {
    const parsed = Number(toEnDigits(rate).replace(/\D/g, "") || "0");
    if (parsed < 0 || parsed > 100) {
      setError("نرخ مالیات باید عددی بین ۰ تا ۱۰۰ باشد.");
      return;
    }
    setError("");
    setSaving(true);
    update((prev) => ({ ...prev, tax: { enabled, rate: parsed } }));
    window.setTimeout(() => {
      setSaving(false);
      showToast({
        variant: "success",
        title: "تنظیمات مالیات ذخیره شد",
        description: "فقط فاکتورهای جدید از این پیش‌فرض استفاده می‌کنند.",
      });
    }, 150);
  };

  const { guardBack } = useUnsavedChanges(dirty, save);

  return (
    <SettingsLayout
      title="مالیات"
      subtitle="پیش‌فرض مالیات فاکتورهای جدید"
      onBack={() => guardBack(() => setLeaveSheetOpen(true), () => navigate("/settings"))}
    >
      <div className="settings-form">
        <Alert
          variant="info"
          title="بدون تغییر فاکتورهای موجود"
          description="این نرخ فقط هنگام ساخت فاکتور جدید به‌عنوان پیش‌فرض استفاده می‌شود؛ فاکتورهای قبلی دست‌نخورده می‌مانند."
        />

        <section className="card settings-card" aria-label="تنظیمات مالیات">
          <div className="list-item">
            <span className="list-item__body">
              <span className="list-item__title">فعال‌بودن مالیات به‌صورت پیش‌فرض</span>
              <span className="list-item__caption">
                فاکتور جدید با مالیات باز می‌شود؛ هنگام ثبت همچنان قابل تغییر است
              </span>
            </span>
            <span className="list-item__end">
              <Switch label="فعال‌بودن مالیات پیش‌فرض" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            </span>
          </div>

          <Field label="نرخ پیش‌فرض (درصد)" error={error || undefined}>
            <Input
              value={toFaDigits(rate)}
              onChange={(e) => setRate(parseAmountDigits(e.target.value))}
              inputMode="numeric"
              placeholder="۹"
            />
          </Field>

          <div className="settings-chips" role="group" aria-label="نرخ‌های پیشنهادی">
            {RATE_SUGGESTIONS.map((r) => (
              <button
                key={r}
                type="button"
                className={`filter-chip${Number(parseAmountDigits(rate) || "0") === r ? " is-active" : ""}`}
                onClick={() => setRate(String(r))}
              >
                {faNum(r)}٪
              </button>
            ))}
          </div>
        </section>

        <SaveBar dirty={dirty} saving={saving} onSave={save} />
      </div>

      <BottomSheet
        open={leaveSheetOpen}
        onClose={() => setLeaveSheetOpen(false)}
        title="تغییرات ذخیره نشده‌اند"
      >
        <p className="sheet-note">تنظیمات مالیات هنوز ذخیره نشده است.</p>
        <div className="sheet-actions">
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => {
              save();
              setLeaveSheetOpen(false);
              navigate("/settings");
            }}
          >
            ذخیره و خروج
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--block"
            onClick={() => {
              setLeaveSheetOpen(false);
              navigate("/settings");
            }}
          >
            خروج بدون ذخیره
          </button>
          <button
            type="button"
            className="btn btn--text btn--block"
            onClick={() => setLeaveSheetOpen(false)}
          >
            انصراف
          </button>
        </div>
      </BottomSheet>
    </SettingsLayout>
  );
}
