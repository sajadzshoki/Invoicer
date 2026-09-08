import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Paperclip } from "lucide-react";
import { BottomSheet } from "@/components/ui/Overlay";
import { Button } from "@/components/ui/Button";
import {
  AmountInput,
  DatePickerTrigger,
  Field,
  Textarea,
  useFieldId,
} from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { DateSelectSheet } from "./DateSelectSheet";
import { faDateLong, todayIso } from "@/lib/jalali";
import { faToman, parseAmountDigits } from "@/lib/fa";

export type MoneyKind = "received" | "paid";

export interface MoneyFormValues {
  amount: number;
  date: string;
  description?: string;
}

export interface MoneyFormSheetProps {
  open: boolean;
  kind: MoneyKind;
  partyName: string;
  onClose: () => void;
  /** ذخیرهٔ تراکنش — معمولاً توسط استور انجام می‌شود */
  onSubmit: (values: MoneyFormValues) => Promise<void> | void;
}

/**
 * فرم «پول گرفتم» و «پول دادم» — یک فرم مشترک با هویت بصری متمایز
 * برای دریافت (سبز/ورودی پول) و پرداخت (قرمز/خروج پول).
 */
export function MoneyFormSheet({
  open,
  kind,
  partyName,
  onClose,
  onSubmit,
}: MoneyFormSheetProps) {
  const isReceived = kind === "received";
  const { showToast } = useToast();

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [desc, setDesc] = useState("");
  const [errors, setErrors] = useState<{ amount?: string; date?: string }>({});
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const amountId = useFieldId();
  const descId = useFieldId();

  const reset = () => {
    setAmount("");
    setDate(todayIso());
    setDesc("");
    setErrors({});
    setSubmitting(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    const next: { amount?: string; date?: string } = {};
    const digits = parseAmountDigits(amount);
    const value = Number(digits);
    if (!digits || value <= 0) {
      next.amount = "مبلغ را وارد کنید.";
    }
    if (!date) {
      next.date = "تاریخ را انتخاب کنید.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await Promise.all([
        onSubmit({ amount: value, date, description: desc.trim() || undefined }),
        new Promise((r) => setTimeout(r, 550)),
      ]);
      showToast({
        variant: "success",
        title: isReceived ? "دریافت ثبت شد" : "پرداخت ثبت شد",
        description: `${faToman(value)} ${isReceived ? `از ${partyName} دریافت شد` : `به ${partyName} پرداخت شد`} و ماندهٔ حساب به‌روزرسانی شد.`,
      });
      close();
    } catch {
      showToast({
        variant: "error",
        title: "ثبت انجام نشد",
        description: "مشکلی پیش آمد؛ دوباره تلاش کنید.",
      });
      setSubmitting(false);
    }
  };

  return (
    <>
      <BottomSheet
        open={open}
        onClose={close}
        title={isReceived ? "پول گرفتم" : "پول دادم"}
      >
        <div
          className={
            isReceived ? "money-banner money-banner--received" : "money-banner money-banner--paid"
          }
        >
          {isReceived ? (
            <ArrowDownToLine size={18} aria-hidden />
          ) : (
            <ArrowUpFromLine size={18} aria-hidden />
          )}
          <span>
            {isReceived
              ? `دریافت پول از ${partyName}`
              : `پرداخت پول به ${partyName}`}
          </span>
        </div>

        <div className="stack mt-2">
          <Field label="مبلغ" htmlFor={amountId} error={errors.amount}>
            <AmountInput
              id={amountId}
              value={amount}
              invalid={!!errors.amount}
              autoFocus
              onValueChange={(v) => {
                setAmount(v);
                if (errors.amount) setErrors((e) => ({ ...e, amount: undefined }));
              }}
            />
          </Field>

          <Field label="تاریخ" error={errors.date}>
            <DatePickerTrigger
              value={date ? faDateLong(date) : undefined}
              invalid={!!errors.date}
              onChange={() => setDateSheetOpen(true)}
            />
          </Field>

          <Field label="توضیحات" htmlFor={descId} optional>
            <Textarea
              id={descId}
              rows={2}
              value={desc}
              placeholder={isReceived ? "مثلاً بابت فاکتور شمارهٔ …" : "مثلاً بابت خرید …"}
              onChange={(e) => setDesc(e.target.value)}
            />
          </Field>

          <button
            type="button"
            className="attach-row"
            onClick={() =>
              showToast({
                variant: "info",
                title: "پیوست فایل در فاز بعدی فعال می‌شود",
              })
            }
          >
            <Paperclip size={18} aria-hidden />
            <span>افزودن پیوست (اختیاری)</span>
          </button>

          <Button
            block
            size="lg"
            loading={submitting}
            onClick={submit}
            icon={
              isReceived ? (
                <ArrowDownToLine size={20} aria-hidden />
              ) : (
                <ArrowUpFromLine size={20} aria-hidden />
              )
            }
          >
            {isReceived ? "ثبت دریافت" : "ثبت پرداخت"}
          </Button>
        </div>
      </BottomSheet>

      <DateSelectSheet
        open={dateSheetOpen}
        onClose={() => setDateSheetOpen(false)}
        value={date}
        onSelect={(iso) => {
          setDate(iso);
          setErrors((e) => ({ ...e, date: undefined }));
        }}
      />
    </>
  );
}
