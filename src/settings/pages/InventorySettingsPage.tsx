import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomSheet } from "@/components/ui/Overlay";
import { Field, Input } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Choice";
import { Alert } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { faNum, parseAmountDigits, toFaDigits } from "@/lib/fa";
import { SettingsLayout } from "../SettingsLayout";
import { SaveBar } from "../SaveBar";
import { useSettings } from "../store";
import { useUnsavedChanges } from "../useUnsavedChanges";

/**
 * پیش‌فرض‌های انبار (فاز ۷)
 * فقط هنگام «ساخت کالای جدید» استفاده می‌شوند؛ کالاهای موجود هرگز به‌صورت
 * خودکار تغییر نمی‌کنند.
 */
export function InventorySettingsPage() {
  const navigate = useNavigate();
  const { settings, update } = useSettings();
  const { showToast } = useToast();

  const [defaultUnit, setDefaultUnit] = useState(settings.inventory.defaultUnit);
  const [defaultReorder, setDefaultReorder] = useState(
    settings.inventory.defaultReorderPoint !== undefined
      ? String(settings.inventory.defaultReorderPoint)
      : ""
  );
  const [lowStockWarning, setLowStockWarning] = useState(settings.inventory.lowStockWarning);
  const [saving, setSaving] = useState(false);
  const [leaveSheetOpen, setLeaveSheetOpen] = useState(false);

  const dirty = useMemo(() => {
    const reorder = defaultReorder.trim() === "" ? undefined : Number(parseAmountDigits(defaultReorder) || "0");
    return (
      defaultUnit !== settings.inventory.defaultUnit ||
      reorder !== settings.inventory.defaultReorderPoint ||
      lowStockWarning !== settings.inventory.lowStockWarning
    );
  }, [defaultUnit, defaultReorder, lowStockWarning, settings.inventory]);

  const save = () => {
    const reorder =
      defaultReorder.trim() === "" ? undefined : Number(parseAmountDigits(defaultReorder) || "0");
    setSaving(true);
    update((prev) => ({
      ...prev,
      inventory: {
        defaultUnit: defaultUnit.trim(),
        defaultReorderPoint: reorder,
        lowStockWarning,
      },
    }));
    window.setTimeout(() => {
      setSaving(false);
      showToast({
        variant: "success",
        title: "پیش‌فرض‌های انبار ذخیره شد",
        description: "فقط هنگام ساخت کالای جدید استفاده می‌شوند.",
      });
    }, 150);
  };

  const { guardBack } = useUnsavedChanges(dirty, save);

  return (
    <SettingsLayout
      title="پیش‌فرض‌های انبار"
      subtitle="واحد، نقطهٔ سفارش و هشدار موجودی"
      onBack={() => guardBack(() => setLeaveSheetOpen(true), () => navigate("/settings"))}
    >
      <div className="settings-form">
        <Alert
          variant="info"
          title="کالاهای موجود تغییر نمی‌کنند"
          description="این پیش‌فرض‌ها فقط فرم ساخت کالای جدید را پر می‌کنند و روی کالاهای ثبت‌شده اثر ندارند."
        />

        <section className="card settings-card" aria-label="پیش‌فرض‌های کالای جدید">
          <h2 className="settings-card__title">پیش‌فرض‌های کالای جدید</h2>
          <Field label="واحد پیش‌فرض" hint="مثل: عدد، کیلوگرم، بطری">
            <Input
              value={defaultUnit}
              onChange={(e) => setDefaultUnit(e.target.value)}
              placeholder="عدد"
            />
          </Field>
          <Field
            label="نقطهٔ سفارش مجدد پیش‌فرض"
            hint="خالی بگذارید اگر پیش‌فرض نمی‌خواهید"
          >
            <Input
              value={toFaDigits(defaultReorder)}
              onChange={(e) => setDefaultReorder(parseAmountDigits(e.target.value))}
              inputMode="numeric"
              placeholder="مثلاً ۵"
            />
          </Field>
        </section>

        <section className="card settings-card" aria-label="هشدار موجودی">
          <h2 className="settings-card__title">هشدار کم‌بودن موجودی</h2>
          <div className="list-item">
            <span className="list-item__body">
              <span className="list-item__title">نمایش وضعیت «رو به اتمام»</span>
              <span className="list-item__caption">
                وقتی موجودی کالا به نقطهٔ سفارش برسد؛ کالای «ناموجود» همیشه نمایش
                داده می‌شود
              </span>
            </span>
            <span className="list-item__end">
              <Switch
                label="نمایش وضعیت رو به اتمام"
                checked={lowStockWarning}
                onChange={(e) => setLowStockWarning(e.target.checked)}
              />
            </span>
          </div>
          {defaultReorder.trim() !== "" && (
            <p className="settings-preview">
              نقطهٔ سفارش پیشنهادی برای کالای جدید:{" "}
              <strong>{faNum(Number(parseAmountDigits(defaultReorder) || "0"))}</strong>
            </p>
          )}
        </section>

        <SaveBar dirty={dirty} saving={saving} onSave={save} />
      </div>

      <BottomSheet
        open={leaveSheetOpen}
        onClose={() => setLeaveSheetOpen(false)}
        title="تغییرات ذخیره نشده‌اند"
      >
        <p className="sheet-note">پیش‌فرض‌های انبار هنوز ذخیره نشده‌اند.</p>
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
