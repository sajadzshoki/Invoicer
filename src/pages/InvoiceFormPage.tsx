import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Banknote,
  CalendarClock,
  ChevronDown,
  FileText,
  HandCoins,
  Minus,
  Package,
  Plus,
  ScrollText,
  ShoppingCart,
  Trash2,
  UserRound,
  Wrench,
} from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { Button, IconButton } from "@/components/ui/Button";
import {
  AmountInput,
  DatePickerTrigger,
  Field,
  Input,
  Textarea,
} from "@/components/ui/Field";
import { Switch } from "@/components/ui/Choice";
import { Alert, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { SegmentedControl } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { DateSelectSheet } from "@/components/party/DateSelectSheet";
import { PartyPickerSheet } from "@/components/invoice/PartyPickerSheet";
import {
  ItemPickerSheet,
  pickDefaultUnitPrice,
} from "@/components/invoice/ItemPickerSheet";
import { InvoiceTotals } from "@/components/invoice/InvoiceTotals";
import { GENERAL_CUSTOMER_NAME, useInvoiceStore } from "@/invoices/store";
import { useChequeStore } from "@/cheques/store";
import { useBookStore } from "@/book/store";
import { useInventoryStore } from "@/inventory/store";
import { useSettings } from "@/settings/store";
import type { Product } from "@/inventory/types";
import type {
  InvoiceType,
  PaymentType,
  ShippingStatus,
} from "@/invoices/types";
import {
  computeTotals,
  faInvoiceNumber,
  INVOICE_TYPE_LABEL,
} from "@/invoices/helpers";
import { faNum, parseAmountDigits, toEnDigits } from "@/lib/fa";
import { faDateLong, todayIso } from "@/lib/jalali";
import { cn } from "@/lib/cn";

/* ------------------------------ مدل فرم ------------------------------ */

interface EditableLine {
  key: string;
  productId: string;
  productType: "PRODUCT" | "SERVICE";
  nameSnapshot: string;
  imageSnapshot?: string;
  unit?: string;
  quantity: string;
  unitPrice: string;
  discount: string;
}

interface ExtraCostRow {
  key: string;
  title: string;
  amount: string;
}

/** عکس فوری وضعیت فرم برای بازگشت از جریان ساخت طرف حساب */
interface FormSnapshot {
  type: InvoiceType;
  date: string;
  time: string;
  partyId?: string;
  lines: EditableLine[];
  invDiscount: string;
  taxEnabled: boolean;
  taxRate: string;
  extraCosts: ExtraCostRow[];
  payment: PaymentType;
  paidAmount: string;
  shipping: ShippingStatus;
  description: string;
  note: string;
  signature: string;
  customerContact: string;
  moreOpen: boolean;
}

const DRAFT_SNAPSHOT_KEY = "nasagh:invoiceFormSnapshot";

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function parseQty(raw: string): number {
  const cleaned = toEnDigits(raw).replace(/[^0-9.]/g, "");
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : 0;
}

let lineSeq = 0;
function newKey(): string {
  lineSeq += 1;
  return `line-${Date.now().toString(36)}-${lineSeq}`;
}

/**
 * فرم ساخت/ویرایش فاکتور فروش، خرید و پیش‌فاکتور
 * ساخت: /invoices/add (با ?convert=sell برای تبدیل پیش‌فاکتور)
 * ویرایش: /invoices/add?id=:id
 */
export function InvoiceFormPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const invoiceStore = useInvoiceStore();
  const chequeStore = useChequeStore();
  const { persons } = useBookStore();
  const inventory = useInventoryStore();
  const { settings } = useSettings();

  const editId = searchParams.get("id") ?? undefined;
  const editing = useMemo(
    () => (editId ? invoiceStore.getInvoice(editId) : undefined),
    [editId, invoiceStore]
  );
  const isEdit = !!editId;
  const notFound = isEdit && !editing;

  /* ---------- حالت فرم ---------- */
  /* پیش‌فرض‌ها فقط برای فاکتور «جدید» از تنظیمات می‌آیند؛ فاکتور موجود
     هنگام ویرایش با مقدارهای خودش باز می‌شود و تنظیمات به آن تحمیل نمی‌شود. */
  const [type, setType] = useState<InvoiceType>(
    editing?.type ?? settings.invoice.defaults.type
  );
  const [date, setDate] = useState(editing?.date ?? todayIso());
  const [time, setTime] = useState(editing?.time ?? nowHHMM());
  const [partyId, setPartyId] = useState<string | undefined>(editing?.personId);
  const [lines, setLines] = useState<EditableLine[]>(
    () =>
      editing?.items.map((it) => ({
        key: newKey(),
        productId: it.productId,
        productType: it.productType,
        nameSnapshot: it.nameSnapshot,
        imageSnapshot: it.imageSnapshot,
        unit: it.unit,
        quantity: faNum(it.quantity),
        unitPrice: faNum(it.unitPrice),
        discount: it.discount > 0 ? faNum(it.discount) : "",
      })) ?? []
  );
  const [invDiscount, setInvDiscount] = useState(
    editing && editing.discount > 0 ? faNum(editing.discount) : ""
  );
  /* مالیات: پیش‌فرض از تنظیمات (فاز ۷) — فقط برای فاکتور جدید */
  const [taxEnabled, setTaxEnabled] = useState(
    editing?.taxEnabled ?? settings.tax.enabled
  );
  const [taxRate, setTaxRate] = useState(
    editing ? faNum(editing.taxRate) : faNum(settings.tax.rate)
  );
  const [extraCosts, setExtraCosts] = useState<ExtraCostRow[]>(
    () =>
      editing?.extraCosts.map((ec) => ({
        key: newKey(),
        title: ec.title,
        amount: faNum(ec.amount),
      })) ?? []
  );
  const [payment, setPayment] = useState<PaymentType>(
    editing?.paymentType ??
      (settings.payments[settings.invoice.defaults.paymentType]
        ? settings.invoice.defaults.paymentType
        : "CASH")
  );
  const [paidAmount, setPaidAmount] = useState(
    editing && editing.paidAmount > 0 ? faNum(editing.paidAmount) : ""
  );
  const [shipping, setShipping] = useState<ShippingStatus>(
    editing?.shippingStatus ?? "NOT_SENT"
  );
  /* توضیح پیش‌فرض از تنظیمات (فاز ۷) — فقط برای فاکتور جدید */
  const [description, setDescription] = useState(
    editing?.description ?? settings.invoice.defaults.description
  );
  const [note, setNote] = useState(editing?.note ?? "");
  const [signature, setSignature] = useState(editing?.signature ?? "");
  const [customerContact, setCustomerContact] = useState(
    editing?.customerContact ?? ""
  );
  const [moreOpen, setMoreOpen] = useState(!!editing?.description);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [partySheetOpen, setPartySheetOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const isDraft = type === "DRAFT";
  const isSell = type === "SELL";

  /* فاکتور چکی‌دار در حال ویرایش: تا زمانی که چک متصل است، نوع فاکتور و
     نوع تسویه قفل می‌ماند تا اثر مالی چک‌ها با تغییر نوع بازنویسی/دو بار
     اعمال نشود. */
  const editingHasCheques =
    isEdit &&
    editing?.paymentType === "CHEQUE" &&
    !!editId &&
    chequeStore.invoiceCheques(editId).length > 0;

  /* ---------- بازگردانی فرم پس از بازگشت از ساخت طرف حساب ---------- */
  useEffect(() => {
    let snapshot: FormSnapshot | null = null;
    try {
      const raw = sessionStorage.getItem(DRAFT_SNAPSHOT_KEY);
      if (raw) {
        snapshot = JSON.parse(raw) as FormSnapshot;
        sessionStorage.removeItem(DRAFT_SNAPSHOT_KEY);
      }
    } catch {
      /* دادهٔ خراب نادیده گرفته می‌شود */
    }
    if (snapshot) {
      setType(snapshot.type);
      setDate(snapshot.date);
      setTime(snapshot.time);
      setPartyId(snapshot.partyId);
      setLines(snapshot.lines);
      setInvDiscount(snapshot.invDiscount);
      setTaxEnabled(snapshot.taxEnabled);
      setTaxRate(snapshot.taxRate);
      setExtraCosts(snapshot.extraCosts);
      setPayment(snapshot.payment);
      setPaidAmount(snapshot.paidAmount);
      setShipping(snapshot.shipping);
      setDescription(snapshot.description);
      setNote(snapshot.note);
      setSignature(snapshot.signature);
      setCustomerContact(snapshot.customerContact);
      setMoreOpen(snapshot.moreOpen);
    }

    // طرف حساب تازه‌ساخته در جریان قبلی، انتخاب می‌شود
    try {
      const pending = sessionStorage.getItem("nasagh:pendingPartyId");
      if (pending) {
        sessionStorage.removeItem("nasagh:pendingPartyId");
        setPartyId(pending);
        return;
      }
    } catch {
      /* دسترسی نبود */
    }

    // در حالت ساخت، انتخاب پیش‌فرض «مشتری عمومی» است
    if (!snapshot && !isEdit) {
      const general = persons.find((p) => p.name === GENERAL_CUSTOMER_NAME);
      if (general) setPartyId(general.id);
    }
    // فقط یک‌بار در بارگذاری اولیه
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ذخیرهٔ وضعیت فرم پیش از رفتن به فرم ساخت طرف حساب */
  const leaveToAddParty = () => {
    const snapshot: FormSnapshot = {
      type,
      date,
      time,
      partyId,
      lines,
      invDiscount,
      taxEnabled,
      taxRate,
      extraCosts,
      payment,
      paidAmount,
      shipping,
      description,
      note,
      signature,
      customerContact,
      moreOpen,
    };
    try {
      sessionStorage.setItem(DRAFT_SNAPSHOT_KEY, JSON.stringify(snapshot));
    } catch {
      /* ذخیرهٔ جلسه در دسترس نبود */
    }
    const returnTo = encodeURIComponent(
      window.location.pathname + window.location.search
    );
    navigate(`/bookAccount/add-customer?returnTo=${returnTo}`);
  };

  /* ---------- تبدیل پیش‌فاکتور به فروش ---------- */
  useEffect(() => {
    if (searchParams.get("convert") === "sell") {
      setType("SELL");
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("convert");
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  /* ---------- محاسبهٔ زندهٔ جمع‌ها ---------- */

  const parsedLines = useMemo(
    () =>
      lines.map((line) => {
        const quantity = parseQty(line.quantity);
        const unitPrice = Number(parseAmountDigits(line.unitPrice) || "0");
        const discount = Number(parseAmountDigits(line.discount) || "0");
        const gross = quantity * unitPrice;
        return {
          ...line,
          quantity,
          unitPrice,
          discount: Math.min(discount, gross),
          gross,
          total: Math.max(0, gross - discount),
        };
      }),
    [lines]
  );

  const totals = useMemo(() => {
    const grossTotal = parsedLines.reduce((sum, l) => sum + l.gross, 0);
    const itemsDiscount = parsedLines.reduce((sum, l) => sum + l.discount, 0);
    const extraCostsTotal = extraCosts.reduce(
      (sum, ec) => sum + Number(parseAmountDigits(ec.amount) || "0"),
      0
    );
    return computeTotals({
      grossTotal,
      itemsDiscount,
      discount: Number(parseAmountDigits(invDiscount) || "0"),
      taxEnabled,
      taxRate: Number(toEnDigits(taxRate).replace(/\D/g, "") || "0"),
      extraCostsTotal,
    });
  }, [parsedLines, invDiscount, taxEnabled, taxRate, extraCosts]);

  if (notFound) {
    return (
      <>
        <PageHeader title="ویرایش فاکتور" onBack />
        <div className="page">
          <ErrorState
            title="فاکتور پیدا نشد"
            description="ممکن است این فاکتور حذف شده باشد."
            action={
              <Button onClick={() => navigate("/invoices/invoice/list")}>
                بازگشت به فهرست
              </Button>
            }
          />
        </div>
      </>
    );
  }

  const party = persons.find((p) => p.id === partyId);

  const paidValue = Number(parseAmountDigits(paidAmount) || "0");
  const installmentRemaining = Math.max(0, totals.totalAmount - paidValue);

  /** موجودی در دسترس برای فروش — هنگام ویرایش، مقدار خود فاکتور برمی‌گردد */
  const availableFor = (productId: string): number => {
    const product = inventory.products.find((p) => p.id === productId);
    const stock = product?.currentStock ?? 0;
    const restored = editId ? inventory.soldByInvoice(editId, productId) : 0;
    return stock + restored;
  };

  /* ---------- عملیات خط‌ها ---------- */

  const addLine = (product: Product) => {
    setLines((list) => [
      ...list,
      {
        key: newKey(),
        productId: product.id,
        productType: product.type,
        nameSnapshot: product.name,
        imageSnapshot: product.image,
        unit: product.type === "PRODUCT" ? product.unit : undefined,
        quantity: faNum(1),
        unitPrice: faNum(pickDefaultUnitPrice(product, type)),
        discount: "",
      },
    ]);
    setErrors((er) => ({ ...er, items: "" }));
  };

  const patchLine = (key: string, patch: Partial<EditableLine>) =>
    setLines((list) =>
      list.map((l) => (l.key === key ? { ...l, ...patch } : l))
    );

  const removeLine = (key: string) =>
    setLines((list) => list.filter((l) => l.key !== key));

  const stepQty = (key: string, rawQuantity: string, delta: number) => {
    const current = parseQty(rawQuantity);
    const next = Math.max(1, Math.round((current || 1) + delta));
    patchLine(key, { quantity: faNum(next) });
  };

  /* ---------- اعتبارسنجی و ثبت ---------- */

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (lines.length === 0) next.items = "حداقل یک قلم به فاکتور اضافه کنید.";
    for (const line of parsedLines) {
      if (!(line.quantity > 0)) {
        next[`qty-${line.key}`] = "تعداد باید بیشتر از صفر باشد.";
      }
      if (!(line.unitPrice > 0)) {
        next[`price-${line.key}`] = "قیمت واحد را وارد کنید.";
      }
      if (line.discount > line.gross) {
        next[`disc-${line.key}`] = "تخفیف از مبلغ خط بیشتر است.";
      }
      if (
        isSell &&
        !isDraft &&
        line.productType === "PRODUCT" &&
        line.quantity > 0 &&
        line.quantity > availableFor(line.productId)
      ) {
        next[`qty-${line.key}`] = `موجودی کافی نیست؛ در دسترس: ${faNum(availableFor(line.productId))} واحد.`;
      }
    }
    const discValue = Number(parseAmountDigits(invDiscount) || "0");
    if (discValue > totals.grossTotal - totals.itemsDiscount) {
      next.discount = "تخفیف کل از مبلغ باقی‌مانده بیشتر است.";
    }
    if (taxEnabled) {
      const rate = Number(toEnDigits(taxRate).replace(/\D/g, "") || "0");
      if (rate < 0 || rate > 100) next.taxRate = "نرخ مالیات باید بین ۰ تا ۱۰۰ باشد.";
    }
    for (const ec of extraCosts) {
      if (!ec.title.trim()) {
        next[`ec-${ec.key}`] = "عنوان هزینه را بنویسید.";
      }
    }
    if (!isDraft && payment === "INSTALLMENT") {
      if (paidValue < 0 || paidValue > totals.totalAmount) {
        next.paid = "مبلغ پرداخت‌شده باید بین صفر تا مبلغ کل باشد.";
      }
    }
    return next;
  };

  const submit = () => {
    if (!partyId) {
      setPartySheetOpen(true);
      return;
    }
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showToast({
        variant: "error",
        title: "فرم کامل نیست",
        description: "خطاهای مشخص‌شده را برطرف کنید.",
      });
      return;
    }

    setSubmitting(true);
    const input = {
      type,
      personId: partyId!,
      date,
      time: time || nowHHMM(),
      items: parsedLines.map((l) => ({
        productId: l.productId,
        productType: l.productType,
        nameSnapshot: l.nameSnapshot,
        imageSnapshot: l.imageSnapshot,
        quantity: l.quantity,
        unit: l.unit,
        unitPrice: l.unitPrice,
        discount: l.discount,
      })),
      discount: Number(parseAmountDigits(invDiscount) || "0"),
      taxEnabled,
      taxRate: Number(toEnDigits(taxRate).replace(/\D/g, "") || "0"),
      extraCosts: extraCosts.map((ec) => ({
        title: ec.title.trim(),
        amount: Number(parseAmountDigits(ec.amount) || "0"),
      })),
      paymentType: payment,
      paidAmount: paidValue,
      shippingStatus: shipping,
      description,
      note,
      signature,
      customerContact,
    };

    window.setTimeout(() => {
      const result = invoiceStore.saveInvoice(input, editId);
      if (!result.ok) {
        setSubmitting(false);
        showToast({ variant: "error", title: "ثبت نشد", description: result.error });
        return;
      }
      const inv = result.invoice;
      try {
        sessionStorage.removeItem(DRAFT_SNAPSHOT_KEY);
      } catch {
        /* دسترسی نبود */
      }
      showToast({
        variant: "success",
        title: isEdit
          ? "تغییرات فاکتور ذخیره شد"
          : inv.type === "DRAFT"
            ? "پیش‌فاکتور ذخیره شد"
            : inv.type === "SELL"
              ? "فاکتور فروش ثبت شد"
              : "فاکتور خرید ثبت شد",
        description: `فاکتور ${faInvoiceNumber(inv.invoiceNumber)} با مبلغ ${faNum(inv.totalAmount)} تومان`,
      });
      if (!isEdit && inv.type !== "DRAFT" && inv.paymentType === "CHEQUE") {
        navigate(`/cheque/add/${inv.id}`);
      } else {
        navigate(`/invoices/invoice/${inv.id}`);
      }
    }, 600);
  };

  const cancel = () => {
    if (isEdit) navigate(`/invoices/invoice/${editId}`);
    else navigate("/invoices/invoice/list");
  };

  /* ---------- رندر ---------- */

  return (
    <>
      <PageHeader
        title={isEdit ? "ویرایش فاکتور" : "فاکتور جدید"}
        subtitle={
          isEdit && editing
            ? `${INVOICE_TYPE_LABEL[editing.type]} ${faInvoiceNumber(editing.invoiceNumber)}`
            : "فروش، خرید یا پیش‌فاکتور"
        }
        onBack
      />

      <div className="page form-page">
        <div className="inv-editor">
          <div className="inv-editor__main">
            {/* انتخاب نوع فاکتور */}
            <div className="inv-type-switch" role="radiogroup" aria-label="نوع فاکتور">
              {(
                [
                  { id: "SELL", label: "فروش", icon: <ShoppingCart size={18} aria-hidden /> },
                  { id: "BUY", label: "خرید", icon: <Package size={18} aria-hidden /> },
                  { id: "DRAFT", label: "پیش‌فاکتور", icon: <FileText size={18} aria-hidden /> },
                ] as Array<{ id: InvoiceType; label: string; icon: React.ReactNode }>
              ).map((option) => {
                const locked = editingHasCheques && option.id !== type;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={type === option.id}
                    aria-disabled={locked || undefined}
                    className={cn("inv-type-switch__option", type === option.id && "is-active")}
                    onClick={() => {
                      if (!locked) setType(option.id);
                    }}
                  >
                    {option.icon}
                    {option.label}
                  </button>
                );
              })}
            </div>

            {isDraft && (
              <Alert
                variant="info"
                title="پیش‌فاکتور هیچ اثر مالی یا انباری ندارد"
                description="پس از قطعی‌شدن معامله می‌توانید آن را به فاکتور فروش تبدیل کنید."
              />
            )}

            {/* تاریخ، ساعت و طرف حساب */}
            <div className="card form-card">
              <div className="stack" style={{ gap: "var(--space-4)" }}>
                <div className="grid-2">
                  <Field label="تاریخ">
                    <DatePickerTrigger
                      value={faDateLong(date)}
                      placeholder="انتخاب تاریخ"
                      onChange={() => setDateSheetOpen(true)}
                    />
                  </Field>
                  <Field label="ساعت" htmlFor="inv-time">
                    <Input
                      id="inv-time"
                      type="time"
                      dir="ltr"
                      value={time}
                      style={{ textAlign: "center" }}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="طرف حساب">
                  <button
                    type="button"
                    className="party-pick"
                    onClick={() => setPartySheetOpen(true)}
                  >
                    <UserRound size={20} aria-hidden />
                    <span className="party-pick__name">
                      {party?.name ?? "انتخاب طرف حساب"}
                    </span>
                    {party?.phone && (
                      <span className="party-pick__meta" dir="ltr">
                        {party.phone}
                      </span>
                    )}
                  </button>
                  {!party && (
                    <p className="field__error" role="alert">
                      طرف حساب را انتخاب کنید.
                    </p>
                  )}
                </Field>
              </div>
            </div>

            {/* اقلام فاکتور */}
            <div className="card form-card">
              <div className="section-head">
                <h2>اقلام فاکتور</h2>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Plus size={16} aria-hidden />}
                  onClick={() => setPickerOpen(true)}
                >
                  افزودن قلم
                </Button>
              </div>

              {errors.items && (
                <Alert variant="error" title={errors.items} className="mt-2" />
              )}

              {parsedLines.length === 0 ? (
                <button
                  type="button"
                  className="inv-lines__empty"
                  onClick={() => setPickerOpen(true)}
                >
                  <Plus size={22} aria-hidden />
                  برای افزودن کالا یا خدمت کلیک کنید
                </button>
              ) : (
                <div className="inv-lines">
                  {lines.map((line) => {
                    const parsed = parsedLines.find((p) => p.key === line.key);
                    const lineTotal = parsed?.total ?? 0;
                    const qtyError = errors[`qty-${line.key}`];
                    const priceError = errors[`price-${line.key}`];
                    const discError = errors[`disc-${line.key}`];
                    const isProduct = line.productType === "PRODUCT";
                    const available = isProduct ? availableFor(line.productId) : 0;
                    const lowStock =
                      isSell &&
                      !isDraft &&
                      isProduct &&
                      (parsed?.quantity ?? 0) > available;
                    return (
                      <div key={line.key} className="inv-line">
                        <div className="inv-line__head">
                          {line.imageSnapshot ? (
                            <img
                              className="item-thumb"
                              src={line.imageSnapshot}
                              alt={line.nameSnapshot}
                            />
                          ) : (
                            <span className="item-thumb item-thumb--placeholder" aria-hidden>
                              {isProduct ? <Package size={18} /> : <Wrench size={18} />}
                            </span>
                          )}
                          <div className="inv-line__title">
                            <span className="inv-line__name">{line.nameSnapshot}</span>
                            <span className="inv-line__meta">
                              {isProduct && line.unit
                                ? `واحد: ${line.unit}`
                                : "خدمت"}
                              {isSell && !isDraft && isProduct && (
                                <> · موجودی: {faNum(available)}</>
                              )}
                            </span>
                          </div>
                          <IconButton
                            label="حذف قلم"
                            className="inv-line__remove"
                            onClick={() => removeLine(line.key)}
                          >
                            <Trash2 size={18} aria-hidden />
                          </IconButton>
                        </div>

                        <div className="inv-line__grid">
                          <Field label="تعداد" error={qtyError} htmlFor={`qty-${line.key}`}>
                            <div className="qty-stepper">
                              <IconButton
                                label="کاهش تعداد"
                                onClick={() => stepQty(line.key, line.quantity, -1)}
                                disabled={submitting}
                              >
                                <Minus size={16} aria-hidden />
                              </IconButton>
                              <input
                                id={`qty-${line.key}`}
                                className="qty-stepper__input"
                                inputMode="decimal"
                                value={line.quantity}
                                aria-invalid={!!qtyError}
                                onChange={(e) =>
                                  patchLine(line.key, { quantity: e.target.value })
                                }
                              />
                              <IconButton
                                label="افزایش تعداد"
                                onClick={() => stepQty(line.key, line.quantity, 1)}
                                disabled={submitting}
                              >
                                <Plus size={16} aria-hidden />
                              </IconButton>
                            </div>
                          </Field>
                          <Field
                            label="قیمت واحد"
                            error={priceError}
                            htmlFor={`price-${line.key}`}
                          >
                            <AmountInput
                              id={`price-${line.key}`}
                              value={line.unitPrice}
                              invalid={!!priceError}
                              onValueChange={(v) => patchLine(line.key, { unitPrice: v })}
                            />
                          </Field>
                          <Field
                            label="تخفیف خط"
                            optional
                            error={discError}
                            htmlFor={`disc-${line.key}`}
                          >
                            <AmountInput
                              id={`disc-${line.key}`}
                              value={line.discount}
                              invalid={!!discError}
                              placeholder="۰"
                              onValueChange={(v) => patchLine(line.key, { discount: v })}
                            />
                          </Field>
                        </div>

                        <div className="inv-line__foot">
                          {lowStock || qtyError ? (
                            <span className="inv-line__warning" role="alert">
                              {qtyError ?? "موجودی کافی نیست."}
                            </span>
                          ) : (
                            <span />
                          )}
                          <span className="inv-line__total">
                            جمع: {faNum(lineTotal)} تومان
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* تخفیف، مالیات و هزینه‌ها */}
            <div className="card form-card">
              <div className="section-head">
                <h2>تخفیف، مالیات و هزینه‌ها</h2>
              </div>
              <div className="stack" style={{ gap: "var(--space-4)" }}>
                <Field
                  label="تخفیف کل فاکتور"
                  optional
                  error={errors.discount}
                  htmlFor="inv-discount"
                >
                  <AmountInput
                    id="inv-discount"
                    value={invDiscount}
                    invalid={!!errors.discount}
                    placeholder="۰"
                    onValueChange={setInvDiscount}
                  />
                </Field>

                <div className="online-row">
                  <Switch
                    label={
                      <span>
                        مالیات بر ارزش افزوده
                        <span className="check__desc">به مبلغ پس از تخفیف اضافه می‌شود.</span>
                      </span>
                    }
                    checked={taxEnabled}
                    onChange={(e) => setTaxEnabled(e.target.checked)}
                  />
                  {taxEnabled && (
                    <div className="tax-rate">
                      <input
                        aria-label="نرخ مالیات (درصد)"
                        className="tax-rate__input"
                        inputMode="numeric"
                        value={taxRate}
                        onChange={(e) =>
                          setTaxRate(
                            toEnDigits(e.target.value).replace(/[^0-9]/g, "").slice(0, 3)
                          )
                        }
                      />
                      <span aria-hidden>٪</span>
                    </div>
                  )}
                </div>
                {errors.taxRate && (
                  <p className="field__error" role="alert">
                    {errors.taxRate}
                  </p>
                )}

                <div>
                  <div className="split-head">
                    <span className="split-head__label">هزینه‌های اضافی</span>
                    <Button
                      variant="text"
                      size="sm"
                      icon={<Plus size={14} aria-hidden />}
                      onClick={() =>
                        setExtraCosts((list) => [
                          ...list,
                          { key: newKey(), title: "", amount: "" },
                        ])
                      }
                    >
                      افزودن هزینه
                    </Button>
                  </div>
                  {extraCosts.length === 0 ? (
                    <p className="inv-muted">مثل هزینهٔ حمل یا خدمات — اختیاری</p>
                  ) : (
                    <div className="stack" style={{ gap: "var(--space-2)" }}>
                      {extraCosts.map((ec) => (
                        <div key={ec.key} className="extra-cost">
                          <Input
                            aria-label="عنوان هزینه"
                            value={ec.title}
                            placeholder="مثلاً هزینهٔ حمل"
                            invalid={!!errors[`ec-${ec.key}`]}
                            onChange={(e) =>
                              setExtraCosts((list) =>
                                list.map((x) =>
                                  x.key === ec.key ? { ...x, title: e.target.value } : x
                                )
                              )
                            }
                          />
                          <AmountInput
                            aria-label="مبلغ هزینه"
                            value={ec.amount}
                            placeholder="مبلغ"
                            onValueChange={(v) =>
                              setExtraCosts((list) =>
                                list.map((x) =>
                                  x.key === ec.key ? { ...x, amount: v } : x
                                )
                              )
                            }
                          />
                          <IconButton
                            label="حذف هزینه"
                            onClick={() =>
                              setExtraCosts((list) => list.filter((x) => x.key !== ec.key))
                            }
                          >
                            <Trash2 size={16} aria-hidden />
                          </IconButton>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* تسویه و ارسال — فقط فاکتور مالی */}
            {!isDraft && (
              <div className="card form-card">
                <div className="section-head">
                  <h2>نوع تسویه</h2>
                </div>
                {editingHasCheques && (
                  <Alert
                    variant="info"
                    title="نوع تسویهٔ این فاکتور قفل است"
                    description="این فاکتور چک ثبت‌شده دارد؛ برای تغییر نوع تسویه ابتدا چک‌ها را حذف کنید تا اثر مالی آن‌ها از بین نرود."
                    className="mb-3"
                  />
                )}
                <div className="settlement-grid" role="radiogroup" aria-label="نوع تسویه">
                  {(
                    [
                      { id: "CASH", label: "نقدی", icon: <Banknote size={20} aria-hidden /> },
                      { id: "CREDIT", label: "نسیه", icon: <HandCoins size={20} aria-hidden /> },
                      {
                        id: "INSTALLMENT",
                        label: "اقساط",
                        icon: <CalendarClock size={20} aria-hidden />,
                      },
                      { id: "CHEQUE", label: "چک", icon: <ScrollText size={20} aria-hidden /> },
                    ] as Array<{ id: PaymentType; label: string; icon: React.ReactNode }>
                  )
                    /* روش‌های غیرفعال در تنظیمات برای فاکتور «جدید» پنهان می‌شوند؛
                       هنگام ویرایش فاکتور قدیمی، روش همان فاکتور همیشه قابل انتخاب
                       می‌ماند تا فاکتورهای موجود هرگز نامعتبر نشوند. */
                    .filter(
                      (option) =>
                        settings.payments[option.id] ||
                        (isEdit && editing?.paymentType === option.id)
                    )
                    .map((option) => {
                    const locked = editingHasCheques && option.id !== "CHEQUE";
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={payment === option.id}
                        aria-disabled={locked || undefined}
                        className={cn(
                          "settlement-option",
                          payment === option.id && "is-active"
                        )}
                        onClick={() => {
                          if (!locked) setPayment(option.id);
                        }}
                      >
                        {option.icon}
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                {payment === "CASH" && (
                  <Alert
                    variant="success"
                    title="پرداخت کامل"
                    description="مبلغی به ماندهٔ حساب طرف حساب اضافه نمی‌شود."
                    className="mt-3"
                  />
                )}
                {payment === "CREDIT" && (
                  <Alert
                    variant="info"
                    title={isSell ? "کل مبلغ به‌عنوان طلب ثبت می‌شود" : "کل مبلغ به‌عنوان بدهی ثبت می‌شود"}
                    description={`ماندهٔ حساب طرف حساب به اندازهٔ ${faNum(totals.totalAmount)} تومان ${isSell ? "بدهکار" : "بستانکار"} می‌شود.`}
                    className="mt-3"
                  />
                )}
                {payment === "INSTALLMENT" && (
                  <div className="mt-3">
                    <div className="grid-2">
                      <Field
                        label="مبلغ پرداخت‌شده"
                        error={errors.paid}
                        htmlFor="inv-paid"
                      >
                        <AmountInput
                          id="inv-paid"
                          value={paidAmount}
                          invalid={!!errors.paid}
                          placeholder="۰"
                          onValueChange={setPaidAmount}
                        />
                      </Field>
                      <div className="paid-remaining">
                        <span>باقی‌مانده</span>
                        <strong>{faNum(installmentRemaining)} تومان</strong>
                        <small>فقط باقی‌مانده روی ماندهٔ حساب اثر می‌گذارد.</small>
                      </div>
                    </div>
                  </div>
                )}
                {payment === "CHEQUE" && (
                  <Alert
                    variant="warning"
                    title="چک هنوز تسویه نشده است"
                    description="پس از ثبت فاکتور برای ثبت چک هدایت می‌شوید؛ اثر مالی فاکتور تا تعیین وضعیت چک اعمال نمی‌شود."
                    className="mt-3"
                  />
                )}

                <div className="mt-4">
                  <div className="split-head">
                    <span className="split-head__label">وضعیت ارسال</span>
                  </div>
                  <SegmentedControl
                    ariaLabel="وضعیت ارسال"
                    block
                    items={[
                      { id: "NOT_SENT", label: "ارسال نشده" },
                      { id: "SENT", label: "ارسال شده" },
                    ]}
                    active={shipping}
                    onChange={(v) => setShipping(v as ShippingStatus)}
                  />
                </div>
              </div>
            )}

            {/* اطلاعات بیشتر */}
            <div className="card form-card">
              <button
                type="button"
                className="more-toggle"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((v) => !v)}
              >
                اطلاعات بیشتر (اختیاری)
                <ChevronDown
                  size={18}
                  aria-hidden
                  className={cn("more-toggle__icon", moreOpen && "is-open")}
                />
              </button>
              {moreOpen && (
                <div className="stack mt-4" style={{ gap: "var(--space-4)" }}>
                  <Field label="توضیحات" htmlFor="inv-desc">
                    <Textarea
                      id="inv-desc"
                      rows={2}
                      value={description}
                      placeholder="توضیح دربارهٔ فاکتور"
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </Field>
                  <Field label="یادداشت" htmlFor="inv-note">
                    <Textarea
                      id="inv-note"
                      rows={2}
                      value={note}
                      placeholder="یادداشت داخلی یا برای مشتری"
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </Field>
                  <div className="grid-2">
                    <Field label="امضا" htmlFor="inv-signature">
                      <Input
                        id="inv-signature"
                        value={signature}
                        placeholder="نام امضاکننده"
                        onChange={(e) => setSignature(e.target.value)}
                      />
                    </Field>
                    <Field label="اطلاعات تماس مشتری" htmlFor="inv-contact">
                      <Input
                        id="inv-contact"
                        value={customerContact}
                        placeholder="شماره یا نشانی تحویل"
                        onChange={(e) => setCustomerContact(e.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* خلاصهٔ زنده — ستون کناری دسکتاپ */}
          <aside className="inv-editor__side" aria-label="خلاصهٔ فاکتور">
            <div className="card">
              <div className="section-head">
                <h2>خلاصهٔ فاکتور</h2>
              </div>
              <InvoiceTotals
                totals={totals}
                extraCosts={extraCosts
                  .filter((ec) => Number(parseAmountDigits(ec.amount) || "0") > 0)
                  .map((ec) => ({
                    title: ec.title.trim() || "هزینهٔ اضافی",
                    amount: Number(parseAmountDigits(ec.amount) || "0"),
                  }))}
                taxEnabled={taxEnabled}
                taxRate={Number(toEnDigits(taxRate).replace(/\D/g, "") || "0")}
              />
            </div>
          </aside>
        </div>
      </div>

      {/* نوار اقدام چسبان */}
      <div className="sticky-footer">
        <div className="sticky-footer__inner sticky-footer__inner--split">
          <div className="sticky-total">
            <span>مبلغ کل</span>
            <strong>{faNum(totals.totalAmount)} تومان</strong>
          </div>
          <div className="sticky-total__actions">
            <Button size="lg" loading={submitting} onClick={submit}>
              {isEdit
                ? "ذخیرهٔ تغییرات"
                : isDraft
                  ? "ذخیرهٔ پیش‌فاکتور"
                  : isSell
                    ? "ثبت فاکتور فروش"
                    : "ثبت فاکتور خرید"}
            </Button>
            <Button variant="ghost" onClick={cancel} disabled={submitting}>
              انصراف
            </Button>
          </div>
        </div>
      </div>

      {/* برگه‌ها */}
      <DateSelectSheet
        open={dateSheetOpen}
        onClose={() => setDateSheetOpen(false)}
        title="تاریخ فاکتور"
        value={date}
        onSelect={setDate}
      />

      <PartyPickerSheet
        open={partySheetOpen}
        onClose={() => setPartySheetOpen(false)}
        selectedId={partyId}
        onSelect={(person) => setPartyId(person.id)}
        onAddNew={leaveToAddParty}
      />

      <ItemPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        invoiceType={type}
        disabledIds={lines.map((l) => l.productId)}
        onPick={addLine}
      />
    </>
  );
}

/** اسکلت فرم — برای سازگاری با الگوی صفحات دیگر نگه داشته می‌شود */
export function InvoiceFormSkeleton() {
  return (
    <div className="page">
      <Skeleton height={52} width="100%" />
      <Skeleton height={200} width="100%" className="mt-4" />
    </div>
  );
}
