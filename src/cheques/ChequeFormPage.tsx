import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FileSignature, Landmark, UserRound } from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  AmountInput,
  DatePickerTrigger,
  Field,
  Input,
  Textarea,
  useFieldId,
} from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/Tabs";
import { Alert, ErrorState } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { DateSelectSheet } from "@/components/party/DateSelectSheet";
import { PartyPickerSheet } from "@/components/invoice/PartyPickerSheet";
import { BankSheet } from "@/components/cheque/BankSheet";
import { AttachmentPicker } from "@/components/common/AttachmentPicker";
import { useChequeStore } from "@/cheques/store";
import { useBookStore } from "@/book/store";
import { useInvoiceStore } from "@/invoices/store";
import { useSettings } from "@/settings/store";
import type { ChequeAttachment, ChequeStatus, ChequeType } from "@/cheques/types";
import { CHEQUE_STATUS_LABEL, CHEQUE_TYPE_LABEL, isValidSayadi } from "@/cheques/helpers";
import { faInvoiceNumber, outstandingAmount } from "@/invoices/helpers";
import { faNum, parseAmountDigits } from "@/lib/fa";
import { faDateLong, todayIso } from "@/lib/jalali";

interface FormErrors {
  amount?: string;
  dueDate?: string;
  sayadi?: string;
  bank?: string;
  person?: string;
}

/**
 * فرم ثبت/ویرایش چک
 * مسیرها: /cheque/add (مستقل)، /cheque/add/:invoiceId (از فاکتور)، ?id= برای ویرایش
 */
export function ChequeFormPage() {
  const navigate = useNavigate();
  const { invoiceId: invoiceParam } = useParams<{ invoiceId: string }>();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const chequeStore = useChequeStore();
  const { persons } = useBookStore();
  const invoiceStore = useInvoiceStore();
  const { settings } = useSettings();

  const editId = searchParams.get("id") ?? undefined;
  const editing = editId ? chequeStore.getCheque(editId) : undefined;
  const isEdit = !!editId;
  const notFound = isEdit && !editing;

  /* فاکتور مرجع — از مسیر یا از چک در حال ویرایش */
  const linkedInvoiceId = isEdit ? editing?.invoiceId : invoiceParam;
  const invoice = linkedInvoiceId ? invoiceStore.getInvoice(linkedInvoiceId) : undefined;
  const invoiceMissing = !!invoiceParam && !isEdit && !invoice;

  /* جهت چک بر اساس فاکتور */
  const defaultType: ChequeType = invoice
    ? invoice.type === "SELL"
      ? "RECEIVED"
      : "PAID"
    : "RECEIVED";

  /* مبلغ پیش‌فرض: ماندهٔ تسویه فاکتور (با افزودن مبلغ خود چک هنگام ویرایش) */
  const defaultAmount = useMemo(() => {
    if (!invoice) return editing?.amount;
    const settled = chequeStore.settledByCheques(invoice.id);
    const own = editing && editing.invoiceId === invoice.id ? editing.amount : 0;
    return Math.max(0, outstandingAmount(invoice) - settled + own);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice?.id]);

  const [status, setStatus] = useState<ChequeStatus>(editing?.status ?? "PENDING");
  const [amount, setAmount] = useState(
    editing ? faNum(editing.amount) : defaultAmount ? faNum(defaultAmount) : ""
  );
  const [dueDate, setDueDate] = useState(editing?.dueDate ?? "");
  const [sayadi, setSayadi] = useState(editing?.sayadiNumber ?? "");
  // بانک پیش‌فرض از تنظیمات (فاز ۷) — فقط برای چک جدید
  const [bank, setBank] = useState<string | undefined>(
    editing?.bank ?? (settings.cheque.defaultBank || undefined)
  );
  const [type, setType] = useState<ChequeType>(editing?.type ?? defaultType);
  const [description, setDescription] = useState(editing?.description ?? "");
  const [attachment, setAttachment] = useState<ChequeAttachment | undefined>(
    editing?.attachment
  );
  const [personId, setPersonId] = useState<string | undefined>(editing?.personId);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [bankSheetOpen, setBankSheetOpen] = useState(false);
  const [partySheetOpen, setPartySheetOpen] = useState(false);

  const amountId = useFieldId();
  const sayadiId = useFieldId();

  /* ---------- بازگردانی فرم پس از بازگشت از ساخت طرف حساب ---------- */
  useEffect(() => {
    let snapshot: Record<string, unknown> | null = null;
    try {
      const raw = sessionStorage.getItem("nasagh:chequeFormSnapshot");
      if (raw) {
        snapshot = JSON.parse(raw) as Record<string, unknown>;
        sessionStorage.removeItem("nasagh:chequeFormSnapshot");
      }
    } catch {
      /* دادهٔ خراب نادیده گرفته می‌شود */
    }
    if (snapshot) {
      setStatus(snapshot.status as ChequeStatus);
      setAmount(snapshot.amount as string);
      setDueDate(snapshot.dueDate as string);
      setSayadi(snapshot.sayadi as string);
      setBank(snapshot.bank as string | undefined);
      setType(snapshot.type as ChequeType);
      setDescription(snapshot.description as string);
      setAttachment(snapshot.attachment as ChequeAttachment | undefined);
      setPersonId(snapshot.personId as string | undefined);
    }
    try {
      const pending = sessionStorage.getItem("nasagh:pendingPartyId");
      if (pending) {
        sessionStorage.removeItem("nasagh:pendingPartyId");
        setPersonId(pending);
      }
    } catch {
      /* دسترسی نبود */
    }
    // فقط یک‌بار در بارگذاری اولیه
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ذخیرهٔ وضعیت فرم پیش از رفتن به فرم ساخت طرف حساب */
  const leaveToAddParty = () => {
    try {
      sessionStorage.setItem(
        "nasagh:chequeFormSnapshot",
        JSON.stringify({
          status,
          amount,
          dueDate,
          sayadi,
          bank,
          type,
          description,
          attachment,
          personId,
        })
      );
    } catch {
      /* ذخیرهٔ جلسه در دسترس نبود */
    }
    const returnTo = encodeURIComponent(
      window.location.pathname + window.location.search
    );
    navigate(`/bookAccount/add-customer?returnTo=${returnTo}`);
  };

  /* خروجی‌های هرگز نباید روی فیلدهای شرطی تغییر کنند؛ این اثر فقط مقدار اولیه است */
  useEffect(() => {
    if (!isEdit && invoice && defaultAmount) {
      setAmount((current) => current || faNum(defaultAmount));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice?.id]);

  if (notFound) {
    return (
      <>
        <PageHeader title="ویرایش چک" onBack />
        <div className="page">
          <ErrorState
            title="چک پیدا نشد"
            description="ممکن است این چک حذف شده باشد."
            action={<Button onClick={() => navigate("/cheque/list")}>بازگشت به فهرست چک‌ها</Button>}
          />
        </div>
      </>
    );
  }

  if (invoiceMissing) {
    return (
      <>
        <PageHeader title="ثبت چک" onBack />
        <div className="page">
          <ErrorState
            title="فاکتور پیدا نشد"
            description="چک به فاکتوری متصل است که دیگر وجود ندارد."
            action={<Button onClick={() => navigate("/invoices/invoice/list")}>فهرست فاکتورها</Button>}
          />
        </div>
      </>
    );
  }

  const isFromInvoice = !!invoice;
  const party = persons.find((p) => p.id === personId);
  const invoiceParty = persons.find((p) => p.id === invoice?.personId);

  const clearError = (key: keyof FormErrors) =>
    setErrors((er) => (er[key] ? { ...er, [key]: undefined } : er));

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    const value = Number(parseAmountDigits(amount) || "0");
    if (!amount || value <= 0) next.amount = "مبلغ چک را وارد کنید.";
    if (!dueDate) next.dueDate = "تاریخ سررسید را مشخص کنید.";
    if (sayadi.trim() && !isValidSayadi(sayadi.trim().replace(/\D/g, ""))) {
      next.sayadi = "شمارهٔ صیادی باید ۱۶ رقم باشد.";
    }
    if (!bank) next.bank = "بانک چک را انتخاب کنید.";
    if (!isFromInvoice && !personId) next.person = "طرف حساب چک را انتخاب کنید.";
    return next;
  };

  const submit = () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      showToast({
        variant: "error",
        title: "فرم کامل نیست",
        description: "خطاهای مشخص‌شده را برطرف کنید.",
      });
      return;
    }

    setSubmitting(true);
    const input = {
      sourceType: isFromInvoice ? ("INVOICE" as const) : ("BOOKACCOUNT" as const),
      type,
      status,
      amount: Number(parseAmountDigits(amount)),
      dueDate,
      sayadiNumber: sayadi.trim() || undefined,
      bank,
      description,
      attachment,
      invoiceId: invoice?.id,
      personId: isFromInvoice ? invoice?.personId : personId,
    };

    window.setTimeout(() => {
      const result = chequeStore.saveCheque(input, editId);
      if (!result.ok) {
        setSubmitting(false);
        showToast({ variant: "error", title: "ثبت چک ناموفق بود", description: result.error });
        return;
      }
      showToast({
        variant: "success",
        title: isEdit ? "تغییرات چک ذخیره شد" : "چک ثبت شد",
        description: `چک ${CHEQUE_TYPE_LABEL[type]} با مبلغ ${faNum(input.amount)} تومان`,
      });
      navigate(`/cheque/${result.cheque.id}`);
    }, 600);
  };

  return (
    <>
      <PageHeader
        title={isEdit ? "ویرایش چک" : "ثبت چک"}
        subtitle={
          isFromInvoice && invoice
            ? `برای فاکتور ${faInvoiceNumber(invoice.invoiceNumber)}`
            : "چک مستقل دفتر حساب"
        }
        onBack
      />

      <div className="page form-page">
        {/* زمینهٔ فاکتور */}
        {isFromInvoice && invoice && (
          <Alert
            variant="info"
            title={`فاکتور ${invoice.type === "SELL" ? "فروش" : "خرید"} ${faInvoiceNumber(invoice.invoiceNumber)}`}
            description={`طرف حساب: ${invoiceParty?.name ?? "—"} · مبلغ فاکتور: ${faNum(invoice.totalAmount)} تومان · ماندهٔ تسویه: ${faNum(defaultAmount ?? 0)} تومان`}
          />
        )}

        <div className="card form-card">
          <div className="stack" style={{ gap: "var(--space-5)" }}>
            {/* نوع چک */}
            <Field label="نوع چک">
              <SegmentedControl
                ariaLabel="نوع چک"
                block
                items={[
                  { id: "RECEIVED", label: CHEQUE_TYPE_LABEL.RECEIVED },
                  { id: "PAID", label: CHEQUE_TYPE_LABEL.PAID },
                  { id: "TRANSFERRED", label: CHEQUE_TYPE_LABEL.TRANSFERRED },
                ]}
                active={type}
                onChange={(v) => setType(v as ChequeType)}
              />
            </Field>

            {/* وضعیت */}
            <Field
              label="وضعیت"
              hint="فقط وضعیت «وصول شده» اثر تسویهٔ مالی دارد."
            >
              <div className="chip-row" role="radiogroup" aria-label="وضعیت چک">
                {(
                  ["PENDING", "RECEIVED", "RETURNED", "CANCELLED"] as ChequeStatus[]
                ).map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={status === s}
                    className={`chip${status === s ? " is-active" : ""}`}
                    onClick={() => setStatus(s)}
                  >
                    {CHEQUE_STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid-2">
              <Field label="مبلغ" htmlFor={amountId} error={errors.amount}>
                <AmountInput
                  id={amountId}
                  value={amount}
                  invalid={!!errors.amount}
                  onValueChange={(v) => {
                    setAmount(v);
                    clearError("amount");
                  }}
                />
              </Field>
              <Field label="تاریخ سررسید" error={errors.dueDate}>
                <DatePickerTrigger
                  value={dueDate ? faDateLong(dueDate) : undefined}
                  placeholder="انتخاب سررسید"
                  onChange={() => setDateSheetOpen(true)}
                />
              </Field>
            </div>

            <div className="grid-2">
              <Field
                label="شمارهٔ صیادی"
                htmlFor={sayadiId}
                optional
                error={errors.sayadi}
                hint={!errors.sayadi ? "۱۶ رقم — اختیاری" : undefined}
              >
                <Input
                  id={sayadiId}
                  value={sayadi}
                  invalid={!!errors.sayadi}
                  placeholder="۱۲۳۴۵۶۷۸۹۰۱۲۳۴۵۶"
                  inputMode="numeric"
                  dir="ltr"
                  style={{ textAlign: "end" }}
                  onChange={(e) => {
                    setSayadi(e.target.value);
                    clearError("sayadi");
                  }}
                />
              </Field>
              <Field label="بانک" error={errors.bank}>
                <button
                  type="button"
                  className="party-pick"
                  onClick={() => setBankSheetOpen(true)}
                >
                  <Landmark size={20} aria-hidden />
                  <span className="party-pick__name">{bank ?? "انتخاب بانک"}</span>
                </button>
              </Field>
            </div>

            {/* طرف حساب — فقط برای چک مستقل */}
            {!isFromInvoice && (
              <Field label="طرف حساب" error={errors.person}>
                <button
                  type="button"
                  className="party-pick"
                  onClick={() => setPartySheetOpen(true)}
                >
                  <UserRound size={20} aria-hidden />
                  <span className="party-pick__name">
                    {party?.name ?? "انتخاب طرف حساب"}
                  </span>
                </button>
              </Field>
            )}

            <Field label="توضیحات" optional>
              <Textarea
                rows={2}
                value={description}
                placeholder="توضیح دربارهٔ چک"
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            <Field label="پیوست" optional>
              <AttachmentPicker
                value={attachment}
                onChange={setAttachment}
                hint="پیوست فقط روی همین دستگاه ذخیره می‌شود."
              />
            </Field>
          </div>
        </div>

        <Alert
          variant="warning"
          title="قانون اثر مالی چک"
          description={
            isFromInvoice
              ? "ثبت این چک، بدهی فاکتور را در ماندهٔ طرف حساب فعال می‌کند؛ فقط وقتی وضعیت «وصول شده» باشد به‌عنوان تسویه حساب می‌شود."
              : "این چک مستقل از فاکتور است و فقط در وضعیت «وصول شده» (و وقتی خرج چک نباشد) در حساب طرف حساب اثر می‌گذارد."
          }
          className="mt-4"
        />
      </div>

      {/* نوار اقدام چسبان */}
      <div className="sticky-footer">
        <div className="sticky-footer__inner">
          <Button block size="lg" loading={submitting} icon={<FileSignature size={20} aria-hidden />} onClick={submit}>
            {isEdit ? "ذخیرهٔ تغییرات" : "ثبت چک"}
          </Button>
          <Button
            block
            variant="ghost"
            onClick={() => (isEdit && editing ? navigate(`/cheque/${editing.id}`) : navigate("/cheque/list"))}
            disabled={submitting}
          >
            بازگشت
          </Button>
        </div>
      </div>

      <DateSelectSheet
        open={dateSheetOpen}
        onClose={() => setDateSheetOpen(false)}
        title="تاریخ سررسید"
        value={dueDate || todayIso()}
        onSelect={(iso) => {
          setDueDate(iso);
          clearError("dueDate");
        }}
      />

      <BankSheet
        open={bankSheetOpen}
        onClose={() => setBankSheetOpen(false)}
        selected={bank}
        onSelect={(b) => {
          setBank(b);
          if (b) clearError("bank");
        }}
      />

      {!isFromInvoice && (
        <PartyPickerSheet
          open={partySheetOpen}
          onClose={() => setPartySheetOpen(false)}
          selectedId={personId}
          onSelect={(person) => {
            setPersonId(person.id);
            clearError("person");
          }}
          onAddNew={leaveToAddParty}
        />
      )}
    </>
  );
}
