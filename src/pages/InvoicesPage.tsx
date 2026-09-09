import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  SearchX,
  SlidersHorizontal,
  Truck,
} from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Badge, ListItem, StatusBadge } from "@/components/ui/Card";
import { DatePickerTrigger, SearchInput } from "@/components/ui/Field";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { BottomSheet } from "@/components/ui/Overlay";
import { DateSelectSheet } from "@/components/party/DateSelectSheet";
import { useInvoiceStore } from "@/invoices/store";
import { useBookStore } from "@/book/store";
import type {
  Invoice,
  InvoiceStatus,
  InvoiceType,
  PaymentType,
  ShippingStatus,
} from "@/invoices/types";
import {
  DATE_RANGE_LABEL,
  faInvoiceNumber,
  INVOICE_STATUS_LABEL,
  INVOICE_TYPE_LABEL,
  normalizeForSearch,
  outstandingAmount,
  PAYMENT_TYPE_LABEL,
  presetDateRange,
  SHIPPING_LABEL,
  startOfJalaliMonthIso,
  type DateRangePreset,
} from "@/invoices/helpers";
import { faNum, faToman, faTomanCompact } from "@/lib/fa";
import { faDateLong, relativeFaDate, todayIso } from "@/lib/jalali";
import { cn } from "@/lib/cn";

type TypeFilter = "all" | InvoiceType;
type ShippingFilter = "all" | ShippingStatus;

interface Filters {
  payment: "all" | PaymentType;
  range: "none" | DateRangePreset;
  customFrom?: string;
  customTo?: string;
  shipping: ShippingFilter;
}

const DEFAULT_FILTERS: Filters = {
  payment: "all",
  range: "none",
  shipping: "all",
};

/** متادیتای نمایش وضعیت مالی — رنگ + آیکون + متن */
const STATUS_META: Record<
  InvoiceStatus,
  { tone: "success" | "error" | "info" | "warning" | "neutral"; icon: React.ReactNode }
> = {
  PAID: { tone: "success", icon: <CheckCircle2 size={13} aria-hidden /> },
  UNPAID: { tone: "error", icon: <AlertCircle size={13} aria-hidden /> },
  PARTIAL: { tone: "info", icon: <CalendarClock size={13} aria-hidden /> },
  CHEQUE_PENDING: { tone: "warning", icon: <Clock size={13} aria-hidden /> },
  DRAFT: { tone: "neutral", icon: <FileText size={13} aria-hidden /> },
};

const EMPTY_COPY: Record<TypeFilter, { title: string; description: string }> = {
  all: {
    title: "هنوز فاکتوری ثبت نشده",
    description:
      "با ثبت اولین فاکتور، خلاصهٔ فروش، وضعیت پرداخت و مانده‌حساب‌ها اینجا نمایش داده می‌شود.",
  },
  SELL: {
    title: "هنوز فاکتور فروشی ثبت نشده",
    description: "فاکتورهای فروش شما پس از ثبت در این فهرست قرار می‌گیرند.",
  },
  BUY: {
    title: "هنوز فاکتور خریدی ثبت نشده",
    description: "فاکتورهای خرید از تأمین‌کنندگان پس از ثبت اینجا نمایش داده می‌شود.",
  },
  DRAFT: {
    title: "هنوز پیش‌فاکتوری ندارید",
    description:
      "پیش‌فاکتورها برای ارسال به مشتری پیش از قطعی‌شدن فروش استفاده می‌شوند.",
  },
};

export function InvoicesPage() {
  const navigate = useNavigate();
  const { invoices } = useInvoiceStore();
  const { persons } = useBookStore();

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 600);
    return () => window.clearTimeout(t);
  }, []);

  const [tab, setTab] = useState<TypeFilter>("all");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<Filters>(DEFAULT_FILTERS);
  const [dateSheet, setDateSheet] = useState<"none" | "from" | "to">("none");

  const partyName = (personId: string) =>
    persons.find((p) => p.id === personId)?.name ?? "حذف‌شده";

  /* ------------------------------ خلاصهٔ دوره ------------------------------ */

  const summary = useMemo(() => {
    const monthStart = startOfJalaliMonthIso();
    const today = todayIso();
    let sales = 0;
    let purchases = 0;
    let unsettledCount = 0;
    let unsettledSum = 0;
    for (const inv of invoices) {
      if (inv.type === "SELL" && inv.date >= monthStart && inv.date <= today) {
        sales += inv.totalAmount;
      }
      if (inv.type === "BUY" && inv.date >= monthStart && inv.date <= today) {
        purchases += inv.totalAmount;
      }
      const out = outstandingAmount(inv);
      if (out > 0) {
        unsettledCount += 1;
        unsettledSum += out;
      }
    }
    return { sales, purchases, unsettledCount, unsettledSum };
  }, [invoices]);

  /* ------------------------------ فیلتر و جستجو ------------------------------ */

  const counts = useMemo(() => {
    const c = { all: invoices.length, SELL: 0, BUY: 0, DRAFT: 0 };
    for (const inv of invoices) c[inv.type] += 1;
    return c;
  }, [invoices]);

  const filtered = useMemo(() => {
    const q = normalizeForSearch(query);
    const range =
      filters.range === "custom"
        ? { from: filters.customFrom, to: filters.customTo }
        : filters.range === "none"
          ? null
          : presetDateRange(filters.range);

    return invoices
      .filter((inv) => {
        if (tab !== "all" && inv.type !== tab) return false;
        if (filters.payment !== "all" && inv.paymentType !== filters.payment)
          return false;
        if (
          filters.shipping !== "all" &&
          inv.shippingStatus !== filters.shipping
        )
          return false;
        if (range) {
          if (range.from && inv.date < range.from) return false;
          if (range.to && inv.date > range.to) return false;
        }
        if (!q) return true;
        const numberHit = normalizeForSearch(inv.invoiceNumber).includes(q);
        const partyHit = normalizeForSearch(partyName(inv.personId)).includes(q);
        const descHit =
          !!inv.description && normalizeForSearch(inv.description).includes(q);
        return numberHit || partyHit || descHit;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, tab, query, filters, persons]);

  const activeChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];
    if (filters.payment !== "all") {
      chips.push({
        id: "payment",
        label: `تسویه: ${PAYMENT_TYPE_LABEL[filters.payment]}`,
        onRemove: () => setFilters((f) => ({ ...f, payment: "all" })),
      });
    }
    if (filters.range !== "none") {
      chips.push({
        id: "range",
        label: `بازه: ${DATE_RANGE_LABEL[filters.range]}`,
        onRemove: () => setFilters((f) => ({ ...f, range: "none" })),
      });
    }
    if (filters.shipping !== "all") {
      chips.push({
        id: "shipping",
        label: SHIPPING_LABEL[filters.shipping],
        onRemove: () => setFilters((f) => ({ ...f, shipping: "all" })),
      });
    }
    return chips;
  }, [filters]);

  const hasActiveFilters = activeChips.length > 0;
  const emptyCopy = EMPTY_COPY[tab];

  /* ------------------------------ زیرکامپوننت‌های صفحه ------------------------------ */

  const openSheet = () => {
    setDraft(filters);
    setSheetOpen(true);
  };

  const applyFilters = () => {
    setFilters(draft);
    setSheetOpen(false);
  };

  const resetFilters = () => {
    setDraft(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <>
      <PageHeader
        title="فاکتورها"
        subtitle="فروش، خرید و پیش‌فاکتورها"
        actions={
          <Button
            size="sm"
            icon={<Plus size={18} aria-hidden />}
            onClick={() => navigate("/invoices/add")}
          >
            فاکتور جدید
          </Button>
        }
      />

      <div className="page">
        {/* خلاصهٔ این دوره */}
        <div className="fin-tiles" aria-label="خلاصهٔ این دوره">
          <div className="fin-tile fin-tile--success">
            <span className="fin-tile__label">فروش این ماه</span>
            <span className="fin-tile__value">{faTomanCompact(summary.sales)}</span>
          </div>
          <div className="fin-tile fin-tile--error">
            <span className="fin-tile__label">خرید این ماه</span>
            <span className="fin-tile__value">{faTomanCompact(summary.purchases)}</span>
          </div>
          <div className="fin-tile">
            <span className="fin-tile__label">فاکتورهای تسویه‌نشده</span>
            <span className="fin-tile__value">
              {faNum(summary.unsettledCount)} فاکتور
            </span>
            <span className="fin-tile__unit">{faTomanCompact(summary.unsettledSum)}</span>
          </div>
        </div>

        <Tabs
          className="mt-4"
          ariaLabel="انواع فاکتور"
          tabs={[
            { id: "all", label: "همه", count: counts.all },
            { id: "SELL", label: "فروش", count: counts.SELL },
            { id: "BUY", label: "خرید", count: counts.BUY },
            { id: "DRAFT", label: "پیش‌فاکتور", count: counts.DRAFT },
          ]}
          active={tab}
          onChange={(id) => setTab(id as TypeFilter)}
        />

        <div className="party-controls-row">
          <SearchInput
            value={query}
            placeholder="جستجو: شمارهٔ فاکتور، طرف حساب یا توضیحات"
            onValueChange={setQuery}
            aria-label="جستجوی فاکتور"
          />
          <Button
            variant="secondary"
            icon={<SlidersHorizontal size={18} aria-hidden />}
            onClick={openSheet}
          >
            فیلتر
          </Button>
        </div>

        {activeChips.length > 0 && (
          <div className="control-chip-row">
            {activeChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                className="control-chip"
                onClick={chip.onRemove}
              >
                {chip.label}
                <span aria-hidden>✕</span>
              </button>
            ))}
            <button
              type="button"
              className="control-chip control-chip--clear"
              onClick={() => setFilters(DEFAULT_FILTERS)}
            >
              حذف همهٔ فیلترها
            </button>
          </div>
        )}

        {/* محتوا */}
        {loading ? (
          <ListSkeleton />
        ) : counts[tab] === 0 ? (
          <div
            className="card mt-4"
            style={{ paddingInline: 0, paddingBlock: "var(--space-2)" }}
          >
            <EmptyState
              icon={<FileText size={32} aria-hidden />}
              title={emptyCopy.title}
              description={emptyCopy.description}
              actions={
                <Button
                  icon={<Plus size={18} aria-hidden />}
                  onClick={() => navigate("/invoices/add")}
                >
                  ثبت فاکتور
                </Button>
              }
            />
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="card mt-4"
            style={{ paddingInline: 0, paddingBlock: "var(--space-2)" }}
          >
            <EmptyState
              icon={<SearchX size={30} aria-hidden />}
              title="فاکتوری پیدا نشد"
              description={
                query
                  ? `نتیجه‌ای برای «${query}» با فیلترهای فعلی وجود ندارد.`
                  : "با فیلترهای فعلی نتیجه‌ای وجود ندارد."
              }
              actions={
                <div className="stack" style={{ gap: "var(--space-2)" }}>
                  {query && (
                    <Button variant="secondary" size="sm" onClick={() => setQuery("")}>
                      پاک‌کردن جستجو
                    </Button>
                  )}
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>
                      حذف همهٔ فیلترها
                    </Button>
                  )}
                </div>
              }
            />
          </div>
        ) : (
          <div className="inv-grid mt-4">
            {filtered.map((inv) => (
              <InvoiceCard
                key={inv.id}
                invoice={inv}
                partyName={partyName(inv.personId)}
                onClick={() => navigate(`/invoices/invoice/${inv.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* برگهٔ فیلترها */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="فیلتر فاکتورها">
        <div className="sheet-section">
          <div className="sheet-label">نوع تسویه</div>
          <div className="list">
            {(
              [
                { value: "all", label: "همه" },
                { value: "CASH", label: PAYMENT_TYPE_LABEL.CASH },
                { value: "CREDIT", label: PAYMENT_TYPE_LABEL.CREDIT },
                { value: "INSTALLMENT", label: PAYMENT_TYPE_LABEL.INSTALLMENT },
                { value: "CHEQUE", label: PAYMENT_TYPE_LABEL.CHEQUE },
              ] as Array<{ value: Filters["payment"]; label: string }>
            ).map((option) => (
              <ListItem
                key={option.value}
                title={option.label}
                onClick={() => setDraft((d) => ({ ...d, payment: option.value }))}
                className={cn(draft.payment === option.value && "is-picked")}
              />
            ))}
          </div>
        </div>

        <div className="sheet-section">
          <div className="sheet-label">بازهٔ تاریخ</div>
          <div className="list">
            {(
              [
                { value: "none", label: "همهٔ تاریخ‌ها" },
                { value: "today", label: DATE_RANGE_LABEL.today },
                { value: "week", label: DATE_RANGE_LABEL.week },
                { value: "month", label: DATE_RANGE_LABEL.month },
                { value: "custom", label: DATE_RANGE_LABEL.custom },
              ] as Array<{ value: Filters["range"]; label: string }>
            ).map((option) => (
              <ListItem
                key={option.value}
                title={option.label}
                onClick={() => setDraft((d) => ({ ...d, range: option.value }))}
                className={cn(draft.range === option.value && "is-picked")}
              />
            ))}
          </div>
          {draft.range === "custom" && (
            <div className="grid-2 mt-3">
              <DatePickerTrigger
                value={draft.customFrom ? faDateLong(draft.customFrom) : undefined}
                placeholder="از تاریخ"
                onChange={() => setDateSheet("from")}
              />
              <DatePickerTrigger
                value={draft.customTo ? faDateLong(draft.customTo) : undefined}
                placeholder="تا تاریخ"
                onChange={() => setDateSheet("to")}
              />
            </div>
          )}
        </div>

        <div className="sheet-section">
          <div className="sheet-label">وضعیت ارسال</div>
          <div className="list">
            {(
              [
                { value: "all", label: "همه" },
                { value: "SENT", label: SHIPPING_LABEL.SENT },
                { value: "NOT_SENT", label: SHIPPING_LABEL.NOT_SENT },
              ] as Array<{ value: ShippingFilter; label: string }>
            ).map((option) => (
              <ListItem
                key={option.value}
                title={option.label}
                onClick={() => setDraft((d) => ({ ...d, shipping: option.value }))}
                className={cn(draft.shipping === option.value && "is-picked")}
              />
            ))}
          </div>
        </div>

        <div className="sticky-footer" style={{ position: "static", margin: 0 }}>
          <div className="sticky-footer__inner">
            <Button block onClick={applyFilters}>
              اعمال فیلترها
            </Button>
            <Button block variant="ghost" onClick={resetFilters}>
              حذف فیلترها
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* انتخاب بازهٔ دلخواه */}
      <DateSelectSheet
        open={dateSheet !== "none"}
        onClose={() => setDateSheet("none")}
        title={dateSheet === "from" ? "از تاریخ" : "تا تاریخ"}
        value={dateSheet === "from" ? draft.customFrom : draft.customTo}
        onSelect={(iso) =>
          setDraft((d) =>
            dateSheet === "from" ? { ...d, customFrom: iso } : { ...d, customTo: iso }
          )
        }
      />
    </>
  );
}

/* ------------------------------ کارت فاکتور ------------------------------ */

function InvoiceCard({
  invoice,
  partyName,
  onClick,
}: {
  invoice: Invoice;
  partyName: string;
  onClick: () => void;
}) {
  const meta = STATUS_META[invoice.status];
  const outstanding = outstandingAmount(invoice);

  return (
    <button type="button" className="inv-card" onClick={onClick}>
      <div className="inv-card__top">
        <span className={cn("inv-card__type", `inv-card__type--${invoice.type.toLowerCase()}`)}>
          {INVOICE_TYPE_LABEL[invoice.type]}
        </span>
        <span className="inv-card__number" dir="ltr">
          {faInvoiceNumber(invoice.invoiceNumber)}
        </span>
      </div>

      <div className="inv-card__party">{partyName}</div>
      <div className="inv-card__date">
        {relativeFaDate(invoice.date)} · {faDateLong(invoice.date)}
      </div>

      <div className="inv-card__total">{faToman(invoice.totalAmount)}</div>

      <div className="inv-card__badges">
        <StatusBadge tone={meta.tone} icon={meta.icon}>
          {INVOICE_STATUS_LABEL[invoice.status]}
          {invoice.status === "PARTIAL" && outstanding > 0 && (
            <> · مانده {faTomanCompact(outstanding)}</>
          )}
        </StatusBadge>
        <Badge tone="outline">{PAYMENT_TYPE_LABEL[invoice.paymentType]}</Badge>
        {invoice.shippingStatus && (
          <Badge tone="neutral">
            <Truck size={12} aria-hidden />
            {SHIPPING_LABEL[invoice.shippingStatus]}
          </Badge>
        )}
      </div>
    </button>
  );
}

function ListSkeleton() {
  return (
    <div className="inv-grid mt-4" role="status" aria-label="در حال بارگذاری فاکتورها">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Skeleton width={90} height={14} />
            <Skeleton width={70} height={14} />
          </div>
          <Skeleton width="45%" height={16} className="mt-3" />
          <Skeleton width="60%" height={12} className="mt-2" />
          <Skeleton width="35%" height={18} className="mt-3" />
        </div>
      ))}
    </div>
  );
}
