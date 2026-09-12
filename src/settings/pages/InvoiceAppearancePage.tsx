import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomSheet } from "@/components/ui/Overlay";
import { Field, Textarea } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Choice";
import { SegmentedControl } from "@/components/ui/Tabs";
import { Alert } from "@/components/ui/Feedback";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { SettingsLayout } from "../SettingsLayout";
import { useSettings } from "../store";
import { useUnsavedChanges } from "../useUnsavedChanges";
import type { InvoiceLayout } from "../types";

const TOGGLES: {
  key:
    | "showLogo"
    | "showBusinessAddress"
    | "showBusinessPhone"
    | "showCustomerAddress"
    | "showNotes"
    | "showPaymentInfo"
    | "showFooter";
  title: string;
  caption: string;
}[] = [
  { key: "showLogo", title: "لوگوی کسب‌وکار", caption: "نمایش لوگو در سربرگ فاکتور" },
  { key: "showBusinessAddress", title: "آدرس کسب‌وکار", caption: "آدرس و کد پستی شما در سربرگ" },
  { key: "showBusinessPhone", title: "تلفن کسب‌وکار", caption: "شماره تماس یا موبایل شما در سربرگ" },
  { key: "showCustomerAddress", title: "آدرس طرف حساب", caption: "آدرس مشتری در فاکتور" },
  { key: "showNotes", title: "یادداشت", caption: "یادداشت فاکتور در بخش پایانی" },
  { key: "showPaymentInfo", title: "اطلاعات تسویه", caption: "نوع پرداخت و مبالغ تسویه" },
  { key: "showFooter", title: "پانوشت", caption: "متن پایانی تعریف‌شده در همین صفحه" },
];

/**
 * ظاهر فاکتور (فاز ۷)
 * کلیدها بلافاصله اعمال می‌شوند؛ متن پانوشت با دکمهٔ جدا ذخیره می‌شود و
 * خروج با متن ذخیره‌نشده تأیید می‌خواهد. پیش‌نمایش و چاپ فاکتور هر دو
 * همین تنظیمات را نشان می‌دهند.
 */
export function InvoiceAppearancePage() {
  const navigate = useNavigate();
  const { settings, update } = useSettings();
  const { showToast } = useToast();
  const appearance = settings.invoice.appearance;

  const [footerDraft, setFooterDraft] = useState(appearance.footerText);
  const [leaveSheetOpen, setLeaveSheetOpen] = useState(false);

  const footerDirty = footerDraft !== settings.invoice.appearance.footerText;

  const saveFooter = () => {
    update((prev) => ({
      ...prev,
      invoice: {
        ...prev.invoice,
        appearance: { ...prev.invoice.appearance, footerText: footerDraft },
      },
    }));
    showToast({
      variant: "success",
      title: "پانوشت فاکتور ذخیره شد",
      description: "در چاپ فاکتورهای بعدی نمایش داده می‌شود.",
    });
  };

  const { guardBack } = useUnsavedChanges(footerDirty, saveFooter);

  const setToggle = (key: (typeof TOGGLES)[number]["key"], checked: boolean) => {
    update((prev) => ({
      ...prev,
      invoice: {
        ...prev.invoice,
        appearance: { ...prev.invoice.appearance, [key]: checked },
      },
    }));
  };

  return (
    <SettingsLayout
      title="ظاهر فاکتور"
      subtitle="چیدمان و بخش‌های نمایش داده‌شده"
      onBack={() => guardBack(() => setLeaveSheetOpen(true), () => navigate("/settings"))}
    >
      <div className="settings-form">
        <Alert
          variant="info"
          title="اثر فوری"
          description="این تنظیمات بلافاصله در پیش‌نمایش و چاپ فاکتورها اعمال می‌شود."
        />

        <section className="card settings-card" aria-label="چیدمان">
          <h2 className="settings-card__title">چیدمان</h2>
          <SegmentedControl
            items={[
              { id: "simple", label: "ساده" },
              { id: "formal", label: "رسمی" },
            ]}
            active={appearance.layout}
            onChange={(id) =>
              update((prev) => ({
                ...prev,
                invoice: {
                  ...prev.invoice,
                  appearance: { ...prev.invoice.appearance, layout: id as InvoiceLayout },
                },
              }))
            }
            ariaLabel="چیدمان فاکتور"
            block
          />
        </section>

        <section className="card settings-card" aria-label="بخش‌های نمایش داده‌شده">
          <h2 className="settings-card__title">بخش‌های نمایش داده‌شده</h2>
          {TOGGLES.map((item) => (
            <div className="list-item" key={item.key}>
              <span className="list-item__body">
                <span className="list-item__title">{item.title}</span>
                <span className="list-item__caption">{item.caption}</span>
              </span>
              <span className="list-item__end">
                <Switch
                  label={item.title}
                  checked={appearance[item.key]}
                  onChange={(e) => setToggle(item.key, e.target.checked)}
                />
              </span>
            </div>
          ))}
        </section>

        <section className="card settings-card" aria-label="پانوشت فاکتور">
          <h2 className="settings-card__title">پانوشت فاکتور</h2>
          <Field label="متن پانوشت (چندسطری)">
            <Textarea
              value={footerDraft}
              onChange={(e) => setFooterDraft(e.target.value)}
              rows={3}
              placeholder="مثل: از خرید شما متشکریم."
            />
          </Field>
          <Button onClick={saveFooter} disabled={!footerDirty} variant="secondary">
            ذخیرهٔ پانوشت
          </Button>
        </section>
      </div>

      <BottomSheet
        open={leaveSheetOpen}
        onClose={() => setLeaveSheetOpen(false)}
        title="پانوشت ذخیره نشده است"
      >
        <p className="sheet-note">متن پانوشت فاکتور هنوز ذخیره نشده است.</p>
        <div className="sheet-actions">
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => {
              saveFooter();
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
