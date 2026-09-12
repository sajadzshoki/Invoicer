import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomSheet } from "@/components/ui/Overlay";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Choice";
import { Alert } from "@/components/ui/Feedback";
import { SegmentedControl } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { faInvoiceNumber, PAYMENT_TYPE_LABEL } from "@/invoices/helpers";
import { INVOICE_TYPE_LABEL } from "@/invoices/helpers";
import { parseAmountDigits, toFaDigits } from "@/lib/fa";
import type { InvoiceType, PaymentType } from "@/invoices/types";
import { SettingsLayout } from "../SettingsLayout";
import { SaveBar } from "../SaveBar";
import { useSettings } from "../store";
import { useUnsavedChanges } from "../useUnsavedChanges";
import type { AppSettings, TypeNumbering } from "../types";

interface NumberingDraft {
  prefix: string;
  next: string;
}

/**
 * تنظیمات فاکتور (فاز ۷)
 * شماره‌گذاری فقط روی فاکتورهای «جدید» اعمال می‌شود؛ شمارهٔ فاکتورهای
 * موجود هرگز تغییر نمی‌کند و اگر شمارهٔ پیکربندی‌شده از فاکتورهای موجود
 * عقب باشد، به‌صورت خودکار از آن‌ها جلو می‌زند.
 */
export function InvoiceSettingsPage() {
  const navigate = useNavigate();
  const { settings, update } = useSettings();
  const { showToast } = useToast();

  const [sell, setSell] = useState<NumberingDraft>(toDraft(settings.invoice.numbering.SELL));
  const [buy, setBuy] = useState<NumberingDraft>(toDraft(settings.invoice.numbering.BUY));
  const [draftType, setDraftType] = useState<NumberingDraft>(toDraft(settings.invoice.numbering.DRAFT));
  const [defaultType, setDefaultType] = useState<InvoiceType>(settings.invoice.defaults.type);
  const [defaultPayment, setDefaultPayment] = useState<PaymentType>(
    settings.invoice.defaults.paymentType
  );
  const [defaultDescription, setDefaultDescription] = useState(
    settings.invoice.defaults.description
  );
  const [payments, setPayments] = useState(settings.payments);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [leaveSheetOpen, setLeaveSheetOpen] = useState(false);

  const dirty = useMemo(() => {
    const numbering = {
      SELL: parseNumbering(sell),
      BUY: parseNumbering(buy),
      DRAFT: parseNumbering(draftType),
    };
    return (
      JSON.stringify(numbering) !== JSON.stringify(settings.invoice.numbering) ||
      defaultType !== settings.invoice.defaults.type ||
      defaultPayment !== settings.invoice.defaults.paymentType ||
      defaultDescription !== settings.invoice.defaults.description ||
      JSON.stringify(payments) !== JSON.stringify(settings.payments)
    );
  }, [sell, buy, draftType, defaultType, defaultPayment, defaultDescription, payments, settings]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const rows: [string, NumberingDraft][] = [
      ["sell", sell],
      ["buy", buy],
      ["draft", draftType],
    ];
    for (const [key, row] of rows) {
      if (!row.prefix.trim()) next[`${key}-prefix`] = "پیشوند را وارد کنید؛ مثل INV.";
      const n = Number(parseAmountDigits(row.next) || "0");
      if (!(n >= 1)) next[`${key}-next`] = "شمارهٔ بعدی باید عددی بزرگ‌تر از صفر باشد.";
    }
    if (!payments.CASH && !payments.CREDIT && !payments.INSTALLMENT && !payments.CHEQUE) {
      next.payments = "حداقل یک روش تسویه باید فعال بماند.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = () => {
    if (!validate()) {
      showToast({
        variant: "error",
        title: "فرم کامل نیست",
        description: "خطاهای مشخص‌شده را برطرف کنید.",
      });
      return;
    }
    setSaving(true);
    update((prev): AppSettings => ({
      ...prev,
      invoice: {
        ...prev.invoice,
        numbering: {
          SELL: parseNumbering(sell),
          BUY: parseNumbering(buy),
          DRAFT: parseNumbering(draftType),
        },
        defaults: {
          type: defaultType,
          paymentType: defaultPayment,
          description: defaultDescription.trim(),
        },
      },
      payments: { ...payments },
    }));
    window.setTimeout(() => {
      setSaving(false);
      showToast({
        variant: "success",
        title: "تنظیمات فاکتور ذخیره شد",
        description: "فقط فاکتورهای جدید از این تنظیمات استفاده می‌کنند.",
      });
    }, 150);
  };

  const { guardBack } = useUnsavedChanges(dirty, save);

  return (
    <SettingsLayout
      title="تنظیمات فاکتور"
      subtitle="شماره‌گذاری، پیش‌فرض‌ها و روش‌های تسویه"
      onBack={() => guardBack(() => setLeaveSheetOpen(true), () => navigate("/settings"))}
    >
      <div className="settings-form">
        <section className="card settings-card" aria-label="شماره‌گذاری">
          <h2 className="settings-card__title">شماره‌گذاری</h2>
          <Alert
            variant="info"
            title="فقط فاکتورهای جدید"
            description="شمارهٔ فاکتورهای ثبت‌شده هرگز تغییر نمی‌کند؛ تنظیمات جدید از فاکتور بعدی اعمال می‌شود."
          />
          <NumberingFields
            legend="فروش"
            draft={sell}
            onChange={setSell}
            prefixError={errors["sell-prefix"]}
            nextError={errors["sell-next"]}
          />
          <NumberingFields
            legend="خرید"
            draft={buy}
            onChange={setBuy}
            prefixError={errors["buy-prefix"]}
            nextError={errors["buy-next"]}
          />
          <NumberingFields
            legend="پیش‌فاکتور"
            draft={draftType}
            onChange={setDraftType}
            prefixError={errors["draft-prefix"]}
            nextError={errors["draft-next"]}
          />
        </section>

        <section className="card settings-card" aria-label="پیش‌فرض‌های فاکتور جدید">
          <h2 className="settings-card__title">پیش‌فرض‌های فاکتور جدید</h2>
          <Field label="نوع پیش‌فرض">
            <SegmentedControl
              items={(Object.keys(INVOICE_TYPE_LABEL) as InvoiceType[]).map((t) => ({
                id: t,
                label: INVOICE_TYPE_LABEL[t],
              }))}
              active={defaultType}
              onChange={(id) => setDefaultType(id as InvoiceType)}
              ariaLabel="نوع پیش‌فرض فاکتور"
              block
            />
          </Field>
          <Field label="روش تسویهٔ پیش‌فرض">
            <SegmentedControl
              items={(Object.keys(PAYMENT_TYPE_LABEL) as PaymentType[]).map((p) => ({
                id: p,
                label: PAYMENT_TYPE_LABEL[p],
              }))}
              active={defaultPayment}
              onChange={(id) => setDefaultPayment(id as PaymentType)}
              ariaLabel="روش تسویه پیش‌فرض"
              block
            />
          </Field>
          <Field label="توضیح پیش‌فرض">
            <Textarea
              value={defaultDescription}
              onChange={(e) => setDefaultDescription(e.target.value)}
              rows={2}
              placeholder="توضیحی که به‌صورت پیش‌فرض در فاکتور جدید درج می‌شود"
            />
          </Field>
        </section>

        <section className="card settings-card" aria-label="روش‌های تسویه">
          <h2 className="settings-card__title">روش‌های تسویه</h2>
          <Alert
            variant="info"
            title="فاکتورهای قدیمی دست‌نخورده می‌مانند"
            description="غیرفعال‌کردن یک روش فقط آن را از فرم فاکتور جدید حذف می‌کند؛ فاکتورهای ثبت‌شده با همان روش معتبر باقی می‌مانند."
          />
          {errors.payments && (
            <Alert variant="error" title={errors.payments} />
          )}
          {(Object.keys(PAYMENT_TYPE_LABEL) as PaymentType[]).map((method) => (
            <div className="list-item" key={method}>
              <span className="list-item__body">
                <span className="list-item__title">{PAYMENT_TYPE_LABEL[method]}</span>
                <span className="list-item__caption">
                  {payments[method] ? "در فاکتور جدید قابل انتخاب است" : "در فاکتور جدید پنهان است"}
                </span>
              </span>
              <span className="list-item__end">
                <Switch
                  label={`روش تسویه ${PAYMENT_TYPE_LABEL[method]}`}
                  checked={payments[method]}
                  onChange={(e) =>
                    setPayments((p) => ({ ...p, [method]: e.target.checked }))
                  }
                />
              </span>
            </div>
          ))}
        </section>

        <SaveBar dirty={dirty} saving={saving} onSave={save} />
      </div>

      <BottomSheet
        open={leaveSheetOpen}
        onClose={() => setLeaveSheetOpen(false)}
        title="تغییرات ذخیره نشده‌اند"
      >
        <p className="sheet-note">
          تنظیمات فاکتور هنوز ذخیره نشده است. می‌خواهید قبل از خروج ذخیره کنید؟
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
    </SettingsLayout>
  );
}

function toDraft(n: TypeNumbering): NumberingDraft {
  return { prefix: n.prefix, next: String(n.nextNumber) };
}

function parseNumbering(d: NumberingDraft): TypeNumbering {
  return {
    prefix: d.prefix.trim() || "INV",
    nextNumber: Math.max(1, Number(parseAmountDigits(d.next) || "1")),
  };
}

function NumberingFields({
  legend,
  draft,
  onChange,
  prefixError,
  nextError,
}: {
  legend: string;
  draft: NumberingDraft;
  onChange: (d: NumberingDraft) => void;
  prefixError?: string;
  nextError?: string;
}) {
  const nextDigits = parseAmountDigits(draft.next);
  const previewNumber = `${draft.prefix.trim() || "INV"}-${nextDigits || "؟"}`;
  return (
    <fieldset className="settings-fieldset">
      <legend>{legend}</legend>
      <div className="settings-row-2">
        <Field label="پیشوند" error={prefixError}>
          <Input
            value={draft.prefix}
            onChange={(e) => onChange({ ...draft, prefix: e.target.value })}
            dir="ltr"
            placeholder="INV"
          />
        </Field>
        <Field label="شمارهٔ بعدی" error={nextError}>
          <Input
            value={toFaDigits(draft.next)}
            onChange={(e) => onChange({ ...draft, next: parseAmountDigits(e.target.value) })}
            inputMode="numeric"
            placeholder="۱۰۰۹"
          />
        </Field>
      </div>
      <p className="settings-preview">
        شمارهٔ فاکتور بعدی: <strong dir="ltr">{faInvoiceNumber(previewNumber)}</strong>
      </p>
    </fieldset>
  );
}
