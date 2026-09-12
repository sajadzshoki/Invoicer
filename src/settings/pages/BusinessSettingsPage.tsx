import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomSheet, Modal } from "@/components/ui/Overlay";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { ImagePicker } from "@/components/product/ImagePicker";
import { SettingsLayout } from "../SettingsLayout";
import { SaveBar } from "../SaveBar";
import { useSettings } from "../store";
import { useUnsavedChanges } from "../useUnsavedChanges";
import type { BusinessSettings } from "../types";

/**
 * اطلاعات کسب‌وکار (فاز ۷)
 * این اطلاعات در سربرگ چاپ فاکتور، متن اشتراک‌گذاری و پروفایل برنامه
 * استفاده می‌شود. ذخیره فقط روی همین دستگاه است — هیچ آپلودی وجود ندارد.
 */
export function BusinessSettingsPage() {
  const navigate = useNavigate();
  const { settings, update } = useSettings();
  const { showToast } = useToast();

  const initial = useMemo(() => ({ ...settings.business }), [settings.business]);
  const [draft, setDraft] = useState<BusinessSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [leaveSheetOpen, setLeaveSheetOpen] = useState(false);
  const [logoHintOpen, setLogoHintOpen] = useState(false);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(settings.business),
    [draft, settings.business]
  );

  const set = <K extends keyof BusinessSettings>(key: K, value: BusinessSettings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const save = () => {
    setSaving(true);
    update((prev) => ({ ...prev, business: { ...draft } }));
    window.setTimeout(() => {
      setSaving(false);
      showToast({
        variant: "success",
        title: "اطلاعات کسب‌وکار ذخیره شد",
        description: "این اطلاعات در سربرگ فاکتورهای بعدی استفاده می‌شود.",
      });
    }, 150);
  };

  const { guardBack } = useUnsavedChanges(dirty, save);

  return (
    <SettingsLayout
      title="اطلاعات کسب‌وکار"
      subtitle="نام، لوگو و راه‌های تماس"
      onBack={() => guardBack(() => setLeaveSheetOpen(true), () => navigate("/settings"))}
    >
      <div className="settings-form">
        <Alert
          variant="info"
          title="ذخیره‌سازی محلی"
          description="ذخیره اطلاعات و لوگو فعلاً روی همین دستگاه انجام می‌شود و چیزی به سرور ارسال نمی‌شود."
        />

        <section className="card settings-card" aria-label="لوگو">
          <h2 className="settings-card__title">لوگو</h2>
          <ImagePicker value={draft.logo} onChange={(dataUrl) => set("logo", dataUrl)} />
          <button
            type="button"
            className="btn btn--text"
            onClick={() => setLogoHintOpen(true)}
          >
            لوگو کجا نمایش داده می‌شود؟
          </button>
        </section>

        <section className="card settings-card" aria-label="مشخصات اصلی">
          <h2 className="settings-card__title">مشخصات اصلی</h2>
          <Field label="نام کسب‌وکار">
            <Input
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="مثل: فروشگاه آرمان"
            />
          </Field>
          <Field label="نام صاحب کسب‌وکار">
            <Input
              value={draft.ownerName}
              onChange={(e) => set("ownerName", e.target.value)}
              placeholder="مثل: مریم رضایی"
            />
          </Field>
          <Field label="توضیحات">
            <Textarea
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="معرفی کوتاه کسب‌وکار (اختیاری)"
              rows={3}
            />
          </Field>
        </section>

        <section className="card settings-card" aria-label="اطلاعات تماس">
          <h2 className="settings-card__title">اطلاعات تماس</h2>
          <Field label="شماره تماس">
            <Input
              value={draft.phone}
              onChange={(e) => set("phone", e.target.value)}
              inputMode="tel"
              dir="ltr"
              placeholder="021-12345678"
            />
          </Field>
          <Field label="شماره موبایل">
            <Input
              value={draft.mobile}
              onChange={(e) => set("mobile", e.target.value)}
              inputMode="tel"
              dir="ltr"
              placeholder="0912 345 6789"
            />
          </Field>
          <Field label="ایمیل">
            <Input
              value={draft.email}
              onChange={(e) => set("email", e.target.value)}
              inputMode="email"
              dir="ltr"
              placeholder="info@example.com"
            />
          </Field>
          <Field label="آدرس">
            <Textarea
              value={draft.address}
              onChange={(e) => set("address", e.target.value)}
              rows={2}
              placeholder="آدرس کامل فروشگاه یا دفتر"
            />
          </Field>
          <Field label="کد پستی">
            <Input
              value={draft.postalCode}
              onChange={(e) => set("postalCode", e.target.value)}
              inputMode="numeric"
              dir="ltr"
              placeholder="1234567890"
            />
          </Field>
          <Field label="شناسه / کد اقتصادی">
            <Input
              value={draft.economicCode}
              onChange={(e) => set("economicCode", e.target.value)}
              dir="ltr"
              placeholder="در صورت وجود"
            />
          </Field>
        </section>

        <SaveBar dirty={dirty} saving={saving} onSave={save} />
      </div>

      <BottomSheet
        open={leaveSheetOpen}
        onClose={() => setLeaveSheetOpen(false)}
        title="تغییرات ذخیره نشده‌اند"
      >
        <p className="sheet-note">
          اطلاعات واردشده هنوز ذخیره نشده است. می‌خواهید قبل از خروج ذخیره کنید؟
        </p>
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

      <Modal
        open={logoHintOpen}
        onClose={() => setLogoHintOpen(false)}
        title="لوگوی کسب‌وکار"
        description="لوگو در این موارد استفاده می‌شود:"
        footer={
          <button type="button" className="btn" onClick={() => setLogoHintOpen(false)}>
            متوجه شدم
          </button>
        }
      >
        <ul className="about-list">
          <li>سربرگ چاپ و پیش‌نمایش فاکتور (اگر در «ظاهر فاکتور» فعال باشد)</li>
          <li>پروفایل برنامه در صفحهٔ «بیشتر»</li>
        </ul>
      </Modal>
    </SettingsLayout>
  );
}
