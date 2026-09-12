import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { BottomSheet } from "@/components/ui/Overlay";
import { Button } from "@/components/ui/Button";
import {
  DatePickerTrigger,
  Field,
  Input,
  useFieldId,
} from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { DateSelectSheet } from "@/components/party/DateSelectSheet";
import { faDateLong, todayIso } from "@/lib/jalali";
import { faNum, formatAmountInput, parseAmountDigits } from "@/lib/fa";

export interface StockMovementSheetProps {
  open: boolean;
  kind: "ENTRY" | "EXIT";
  productName: string;
  unit?: string;
  currentStock: number;
  onClose: () => void;
  onSubmit: (values: { quantity: number; date: string; description?: string }) => void;
}

/**
 * ثبت دستی ورود/خروج انبار
 * توجه: این عملیات فقط «موجودی» را تغییر می‌دهد و هیچ اثر مالی
 * (حساب طرف حساب، طلب/بدهی، درآمد/هزینه) ندارد.
 */
export function StockMovementSheet({
  open,
  kind,
  productName,
  unit,
  currentStock,
  onClose,
  onSubmit,
}: StockMovementSheetProps) {
  const isEntry = kind === "ENTRY";
  const { showToast } = useToast();

  const [qty, setQty] = useState("");
  const [date, setDate] = useState(todayIso());
  const [desc, setDesc] = useState("");
  const [errors, setErrors] = useState<{ qty?: string; date?: string }>({});
  const [dateOpen, setDateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const qtyId = useFieldId();
  const descId = useFieldId();

  const reset = () => {
    setQty("");
    setDate(todayIso());
    setDesc("");
    setErrors({});
    setSubmitting(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = () => {
    const next: { qty?: string; date?: string } = {};
    const digits = parseAmountDigits(qty);
    const value = Number(digits);
    if (!digits || value <= 0) {
      next.qty = "تعداد باید عددی بزرگ‌تر از صفر باشد.";
    } else if (!isEntry && value > currentStock) {
      next.qty = `موجودی کافی نیست؛ موجودی فعلی ${faNum(currentStock)} ${unit ?? ""} است.`;
    }
    if (!date) {
      next.date = "تاریخ را انتخاب کنید.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    window.setTimeout(() => {
      onSubmit({ quantity: value, date, description: desc.trim() || undefined });
      showToast({
        variant: "success",
        title: isEntry ? "ورود کالا ثبت شد" : "خروج کالا ثبت شد",
        description: `${faNum(value)} ${unit ?? ""} ${
          isEntry ? `به موجودی «${productName}» اضافه شد.` : `از موجودی «${productName}» کم شد.`
        }`,
      });
      close();
    }, 500);
  };

  return (
    <>
      <BottomSheet
        open={open}
        onClose={close}
        title={isEntry ? "ورود کالا" : "خروج کالا"}
      >
        <div
          className={
            isEntry
              ? "money-banner money-banner--received"
              : "money-banner money-banner--paid"
          }
        >
          {isEntry ? (
            <ArrowDownToLine size={18} aria-hidden />
          ) : (
            <ArrowUpFromLine size={18} aria-hidden />
          )}
          <span>
            {isEntry
              ? `افزایش موجودی «${productName}»`
              : `کاهش موجودی «${productName}»`}
          </span>
        </div>
        <p className="movement-note">
          این عملیات فقط موجودی انبار را تغییر می‌دهد و سند مالی محسوب نمی‌شود.
        </p>

        <div className="stack mt-2">
          <Field
            label="تعداد"
            htmlFor={qtyId}
            error={errors.qty}
            hint={!errors.qty ? `موجودی فعلی: ${faNum(currentStock)} ${unit ?? ""}` : undefined}
          >
            <Input
              id={qtyId}
              value={qty}
              invalid={!!errors.qty}
              autoFocus
              inputMode="numeric"
              placeholder="۰"
              onChange={(e) => {
                setQty(formatAmountInput(e.target.value));
                if (errors.qty) setErrors((er) => ({ ...er, qty: undefined }));
              }}
            />
          </Field>

          <Field label="تاریخ" error={errors.date}>
            <DatePickerTrigger
              value={date ? faDateLong(date) : undefined}
              invalid={!!errors.date}
              onChange={() => setDateOpen(true)}
            />
          </Field>

          <Field label="توضیحات" htmlFor={descId} optional>
            <Input
              id={descId}
              value={desc}
              placeholder={isEntry ? "مثلاً خرید جدید یا مرجوعی" : "مثلاً شمارش انبار یا مرجوعی"}
              onChange={(e) => setDesc(e.target.value)}
            />
          </Field>

          <Button
            block
            size="lg"
            loading={submitting}
            icon={
              isEntry ? (
                <ArrowDownToLine size={20} aria-hidden />
              ) : (
                <ArrowUpFromLine size={20} aria-hidden />
              )
            }
            onClick={submit}
          >
            {isEntry ? "ثبت ورود" : "ثبت خروج"}
          </Button>
        </div>
      </BottomSheet>

      <DateSelectSheet
        open={dateOpen}
        onClose={() => setDateOpen(false)}
        value={date}
        onSelect={(iso) => {
          setDate(iso);
          setErrors((er) => ({ ...er, date: undefined }));
        }}
      />
    </>
  );
}
