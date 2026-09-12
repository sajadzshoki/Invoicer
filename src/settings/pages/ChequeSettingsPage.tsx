import { useState } from "react";
import { Landmark } from "lucide-react";
import { SegmentedControl } from "@/components/ui/Tabs";
import { Switch } from "@/components/ui/Choice";
import { Alert } from "@/components/ui/Feedback";
import { BankSheet } from "@/components/cheque/BankSheet";
import { faNum } from "@/lib/fa";
import { SettingsLayout } from "../SettingsLayout";
import { useSettings } from "../store";

const REMINDER_OPTIONS = [
  { id: "0", label: "روز سررسید" },
  { id: "1", label: "۱ روز قبل" },
  { id: "3", label: "۳ روز قبل" },
  { id: "7", label: "۷ روز قبل" },
];

/**
 * تنظیمات چک (فاز ۷)
 * فقط پیش‌فرض‌های «چک جدید» را کنترل می‌کند؛ چک‌های ثبت‌شده و وضعیت آن‌ها
 * هرگز تغییر نمی‌کنند. یادآور همچنان محلی است — بدون پوش نوتیفیکیشن.
 */
export function ChequeSettingsPage() {
  const { settings, update } = useSettings();
  const cheque = settings.cheque;
  const [bankSheetOpen, setBankSheetOpen] = useState(false);

  return (
    <SettingsLayout title="تنظیمات چک" subtitle="بانک پیش‌فرض و یادآور سررسید">
      <div className="settings-form">
        <Alert
          variant="info"
          title="فقط چک‌های جدید"
          description="این پیش‌فرض‌ها روی چک‌های ثبت‌شده اثر نمی‌گذارند و وضعیت آن‌ها را تغییر نمی‌دهند."
        />

        <section className="card settings-card" aria-label="بانک پیش‌فرض">
          <h2 className="settings-card__title">بانک پیش‌فرض</h2>
          <button
            type="button"
            className="party-pick"
            onClick={() => setBankSheetOpen(true)}
          >
            <Landmark size={20} aria-hidden />
            <span className="party-pick__name">
              {cheque.defaultBank || "انتخاب بانک پیش‌فرض"}
            </span>
          </button>
          <p className="settings-caption">
            هنگام ثبت چک جدید، این بانک به‌صورت پیش‌فرض انتخاب می‌شود و قابل تغییر است.
          </p>
        </section>

        <section className="card settings-card" aria-label="یادآور سررسید">
          <h2 className="settings-card__title">یادآور محلی سررسید</h2>
          <div className="list-item">
            <span className="list-item__body">
              <span className="list-item__title">ساخت یادآور برای چک جدید</span>
              <span className="list-item__caption">
                یادآور محلی داخل برنامه — بدون پوش نوتیفیکیشن
              </span>
            </span>
            <span className="list-item__end">
              <Switch
                label="ساخت یادآور برای چک جدید"
                checked={cheque.reminderEnabled}
                onChange={(e) =>
                  update((prev) => ({
                    ...prev,
                    cheque: { ...prev.cheque, reminderEnabled: e.target.checked },
                  }))
                }
              />
            </span>
          </div>
          {cheque.reminderEnabled && (
            <>
              <p className="settings-caption">یادآور چه زمانی ثبت شود؟</p>
              <SegmentedControl
                items={REMINDER_OPTIONS}
                active={String(Math.min(7, Math.max(0, cheque.reminderDaysBefore)))}
                onChange={(id) =>
                  update((prev) => ({
                    ...prev,
                    cheque: { ...prev.cheque, reminderDaysBefore: Number(id) },
                  }))
                }
                ariaLabel="زمان یادآور سررسید"
                block
              />
              <p className="settings-preview" aria-live="polite">
                برای چکی با سررسید ۲۰ مهر، یادآور
                {cheque.reminderDaysBefore === 0
                  ? " در همان روز سررسید"
                  : ` ${faNum(cheque.reminderDaysBefore)} روز قبل از سررسید`}
                {" "}ثبت می‌شود.
              </p>
            </>
          )}
        </section>
      </div>

      <BankSheet
        open={bankSheetOpen}
        onClose={() => setBankSheetOpen(false)}
        selected={cheque.defaultBank || undefined}
        onSelect={(bank) => {
          update((prev) => ({
            ...prev,
            cheque: { ...prev.cheque, defaultBank: bank ?? "" },
          }));
        }}
      />
    </SettingsLayout>
  );
}
