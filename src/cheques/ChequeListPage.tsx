import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Ban,
  CheckCircle2,
  Clock,
  FileSignature,
  Plus,
  SearchX,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Badge, ListItem, StatusBadge } from "@/components/ui/Card";
import { DatePickerTrigger, SearchInput } from "@/components/ui/Field";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { BottomSheet } from "@/components/ui/Overlay";
import { DateSelectSheet } from "@/components/party/DateSelectSheet";
import { useChequeStore } from "@/cheques/store";
import { useBookStore } from "@/book/store";
import type { Cheque, ChequeStatus, ChequeType } from "@/cheques/types";
import {
  CHEQUE_STATUS_LABEL,
  CHEQUE_STATUS_TONE,
  CHEQUE_TYPE_LABEL,
  computeChequeSummary,
} from "@/cheques/helpers";
import { normalizeForSearch, presetDateRange } from "@/invoices/helpers";
import type { DateRangePreset } from "@/invoices/helpers";
import { faNum, faToman, faTomanCompact } from "@/lib/fa";
import { faDateLong, relativeFaDate, todayIso } from "@/lib/jalali";
import { cn } from "@/lib/cn";

type TypeTab = "all" | ChequeType;
type StatusFilter = "all" | ChequeStatus;
type SortKey = "dueDate" | "newest" | "amountDesc" | "amountAsc";

interface ChequeFilters {
  status: StatusFilter;
  range: "none" | DateRangePreset;
  customFrom?: string;
  customTo?: string;
  dateBasis: "dueDate" | "createdAt";
  sort: SortKey;
}

const DEFAULT_FILTERS: ChequeFilters = {
  status: "all",
  range: "none",
  dateBasis: "dueDate",
  sort: "dueDate",
};

export const CHEQUE_STATUS_ICON: Record<ChequeStatus, React.ReactNode> = {
  PENDING: <Clock size={13} aria-hidden />,
  RECEIVED: <CheckCircle2 size={13} aria-hidden />,
  RETURNED: <XCircle size={13} aria-hidden />,
  CANCELLED: <Ban size={13} aria-hidden />,
};

const TYPE_TONE: Record<ChequeType, "success" | "info" | "neutral"> = {
  RECEIVED: "success",
  PAID: "info",
  TRANSFERRED: "neutral",
};

const EMPTY_COPY: Record<TypeTab, { title: string; description: string }> = {
  all: {
    title: "هنوز چکی ثبت نکرده‌اید",
    description:
      "چک‌های دریافتی و پرداختی خود را ثبت کنید تا سررسید و وضعیت وصول آن‌ها را پیگیری کنید.",
  },
  RECEIVED: {
    title: "هنوز چک دریافتی‌ای ثبت نشده",
    description: "چک‌هایی که از مشتری‌ها می‌گیرید اینجا نمایش داده می‌شوند.",
  },
  PAID: {
    title: "هنوز چک پرداختی‌ای ثبت نشده",
    description: "چک‌هایی که به تأمین‌کننده‌ها می‌دهید اینجا نمایش داده می‌شوند.",
  },
  TRANSFERRED: {
    title: "هنوز چک خرج‌شده‌ای ثبت نشده",
    description: "چک‌های دریافتی که به شخص دیگری واگذار می‌کنید اینجا ثبت می‌شوند.",
  },
};

export function ChequeListPage() {
  const navigate = useNavigate();
  const { cheques } = useChequeStore();
  const { persons } = useBookStore();

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 600);
    return () => window.clearTimeout(t);
  }, []);

  const [tab, setTab] = useState<TypeTab>("all");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ChequeFilters>(DEFAULT_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<ChequeFilters>(DEFAULT_FILTERS);
  const [dateSheet, setDateSheet] = useState<"none" | "from" | "to">("none");

  const partyName = (personId?: string) =>
    personId ? persons.find((p) => p.id === personId)?.name ?? "حذف‌شده" : "—";

  const summary = useMemo(
    () => computeChequeSummary(cheques, todayIso()),
    [cheques]
  );

  const counts = useMemo(() => {
    const c = { all: cheques.length, RECEIVED: 0, PAID: 0, TRANSFERRED: 0 };
    for (const ch of cheques) c[ch.type] += 1;
    return c;
  }, [cheques]);

  const filtered = useMemo(() => {
    const q = normalizeForSearch(query);
    const qDigits = query.replace(/\D/g, "");
    const range =
      filters.range === "custom"
        ? { from: filters.customFrom, to: filters.customTo }
        : filters.range === "none"
          ? null
          : presetDateRange(filters.range);

    const list = cheques.filter((ch) => {
      if (tab !== "all" && ch.type !== tab) return false;
      if (filters.status !== "all" && ch.status !== filters.status) return false;
      if (range) {
        const basis =
          filters.dateBasis === "dueDate" ? ch.dueDate : ch.createdAt.slice(0, 10);
        if (range.from && basis < range.from) return false;
        if (range.to && basis > range.to) return false;
      }
      if (!q && !qDigits) return true;
      const sayadiHit =
        !!qDigits && !!ch.sayadiNumber && ch.sayadiNumber.includes(qDigits);
      const bankHit = !!ch.bank && normalizeForSearch(ch.bank).includes(q);
      const partyHit = normalizeForSearch(partyName(ch.personId)).includes(q);
      const descHit =
        !!ch.description && normalizeForSearch(ch.description).includes(q);
      const amountHit = !!qDigits && String(ch.amount).startsWith(qDigits);
      return sayadiHit || bankHit || partyHit || descHit || amountHit;
    });

    return [...list].sort((a, b) => {
      switch (filters.sort) {
        case "newest":
          return b.createdAt.localeCompare(a.createdAt);
        case "amountDesc":
          return b.amount - a.amount;
        case "amountAsc":
          return a.amount - b.amount;
        default:
          return a.dueDate.localeCompare(b.dueDate);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cheques, tab, query, filters, persons]);

  const activeChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];
    if (filters.status !== "all") {
      chips.push({
        id: "status",
        label: `وضعیت: ${CHEQUE_STATUS_LABEL[filters.status]}`,
        onRemove: () => setFilters((f) => ({ ...f, status: "all" })),
      });
    }
    if (filters.range !== "none") {
      chips.push({
        id: "range",
        label: `بازه: ${
          filters.range === "custom" ? "بازه دلخواه" : filters.range === "today" ? "امروز" : filters.range === "week" ? "این هفته" : "این ماه"
        }`,
        onRemove: () => setFilters((f) => ({ ...f, range: "none" })),
      });
    }
    if (filters.sort !== "dueDate") {
      chips.push({
        id: "sort",
        label: `مرتب‌سازی: ${
          filters.sort === "newest"
            ? "جدیدترین"
            : filters.sort === "amountDesc"
              ? "بیشترین مبلغ"
              : "کمترین مبلغ"
        }`,
        onRemove: () => setFilters((f) => ({ ...f, sort: "dueDate" })),
      });
    }
    return chips;
  }, [filters]);

  const emptyCopy = EMPTY_COPY[tab];

  return (
    <>
      <PageHeader
        title="چک‌ها"
        subtitle="پیگیری چک‌های دریافتی، پرداختی و خرج چک"
        actions={
          <Button
            size="sm"
            icon={<Plus size={18} aria-hidden />}
            onClick={() => navigate("/cheque/add")}
          >
            ثبت چک
          </Button>
        }
      />

      <div className="page">
        {/* خلاصهٔ چک‌ها */}
        <div className="ch-summary" aria-label="خلاصهٔ چک‌ها">
          <div className="ch-summary__tile ch-summary__tile--warning">
            <span className="ch-summary__label">در انتظار وصول</span>
            <strong>{faNum(summary.pendingCount)} چک</strong>
            <span>{faTomanCompact(summary.pendingAmount)}</span>
          </div>
          <div className="ch-summary__tile ch-summary__tile--error">
            <span className="ch-summary__label">سررسید نزدیک</span>
            <strong>{faNum(summary.dueSoonCount)} چک</strong>
            <span>{faTomanCompact(summary.dueSoonAmount)}</span>
          </div>
          <div className="ch-summary__tile ch-summary__tile--success">
            <span className="ch-summary__label">وصول‌شده</span>
            <strong>{faTomanCompact(summary.receivedAmount)}</strong>
          </div>
          <div className="ch-summary__tile">
            <span className="ch-summary__label">برگشتی</span>
            <strong>{faNum(summary.returnedCount)} چک</strong>
            <span>{faTomanCompact(summary.returnedAmount)}</span>
          </div>
        </div>

        <Tabs
          className="mt-4"
          ariaLabel="انواع چک"
          tabs={[
            { id: "all", label: "همه", count: counts.all },
            { id: "RECEIVED", label: "دریافتی", count: counts.RECEIVED },
            { id: "PAID", label: "پرداختی", count: counts.PAID },
            { id: "TRANSFERRED", label: "خرج چک", count: counts.TRANSFERRED },
          ]}
          active={tab}
          onChange={(id) => setTab(id as TypeTab)}
        />

        <div className="party-controls-row">
          <SearchInput
            value={query}
            placeholder="جستجو: صیادی، بانک، طرف حساب یا مبلغ"
            onValueChange={setQuery}
            aria-label="جستجوی چک"
          />
          <Button
            variant="secondary"
            icon={<SlidersHorizontal size={18} aria-hidden />}
            onClick={() => {
              setDraft(filters);
              setSheetOpen(true);
            }}
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

        {loading ? (
          <div className="inv-grid mt-4" role="status" aria-label="در حال بارگذاری چک‌ها">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card">
                <Skeleton width="40%" height={16} />
                <Skeleton width="60%" height={12} className="mt-3" />
                <Skeleton width="35%" height={18} className="mt-3" />
              </div>
            ))}
          </div>
        ) : counts[tab] === 0 ? (
          <div className="card mt-4" style={{ paddingInline: 0, paddingBlock: "var(--space-2)" }}>
            <EmptyState
              icon={<FileSignature size={32} aria-hidden />}
              title={emptyCopy.title}
              description={emptyCopy.description}
              actions={
                <Button icon={<Plus size={18} aria-hidden />} onClick={() => navigate("/cheque/add")}>
                  ثبت چک
                </Button>
              }
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card mt-4" style={{ paddingInline: 0, paddingBlock: "var(--space-2)" }}>
            <EmptyState
              icon={<SearchX size={30} aria-hidden />}
              title="چکی پیدا نشد"
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
                  {activeChips.length > 0 && (
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
            {filtered.map((ch) => (
              <ChequeCard
                key={ch.id}
                cheque={ch}
                partyName={partyName(ch.personId)}
                onClick={() => navigate(`/cheque/${ch.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* برگهٔ فیلترها */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="فیلتر چک‌ها">
        <div className="sheet-section">
          <div className="sheet-label">وضعیت</div>
          <div className="list">
            {(
              [
                { value: "all", label: "همه" },
                { value: "PENDING", label: CHEQUE_STATUS_LABEL.PENDING },
                { value: "RECEIVED", label: CHEQUE_STATUS_LABEL.RECEIVED },
                { value: "RETURNED", label: CHEQUE_STATUS_LABEL.RETURNED },
                { value: "CANCELLED", label: CHEQUE_STATUS_LABEL.CANCELLED },
              ] as Array<{ value: StatusFilter; label: string }>
            ).map((option) => (
              <ListItem
                key={option.value}
                title={option.label}
                className={cn(draft.status === option.value && "is-picked")}
                onClick={() => setDraft((d) => ({ ...d, status: option.value }))}
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
                { value: "today", label: "امروز" },
                { value: "week", label: "این هفته" },
                { value: "month", label: "این ماه" },
                { value: "custom", label: "بازه دلخواه" },
              ] as Array<{ value: ChequeFilters["range"]; label: string }>
            ).map((option) => (
              <ListItem
                key={option.value}
                title={option.label}
                className={cn(draft.range === option.value && "is-picked")}
                onClick={() => setDraft((d) => ({ ...d, range: option.value }))}
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
          <div className="sheet-label mt-4">مبنای تاریخ</div>
          <div className="list">
            {(
              [
                { value: "dueDate", label: "تاریخ سررسید" },
                { value: "createdAt", label: "تاریخ ثبت" },
              ] as Array<{ value: ChequeFilters["dateBasis"]; label: string }>
            ).map((option) => (
              <ListItem
                key={option.value}
                title={option.label}
                className={cn(draft.dateBasis === option.value && "is-picked")}
                onClick={() => setDraft((d) => ({ ...d, dateBasis: option.value }))}
              />
            ))}
          </div>
        </div>

        <div className="sheet-section">
          <div className="sheet-label">مرتب‌سازی</div>
          <div className="list">
            {(
              [
                { value: "dueDate", label: "نزدیک‌ترین سررسید" },
                { value: "newest", label: "جدیدترین" },
                { value: "amountDesc", label: "بیشترین مبلغ" },
                { value: "amountAsc", label: "کمترین مبلغ" },
              ] as Array<{ value: SortKey; label: string }>
            ).map((option) => (
              <ListItem
                key={option.value}
                title={option.label}
                className={cn(draft.sort === option.value && "is-picked")}
                onClick={() => setDraft((d) => ({ ...d, sort: option.value }))}
              />
            ))}
          </div>
        </div>

        <div className="sticky-footer" style={{ position: "static", margin: 0 }}>
          <div className="sticky-footer__inner">
            <Button
              block
              onClick={() => {
                setFilters(draft);
                setSheetOpen(false);
              }}
            >
              اعمال فیلترها
            </Button>
            <Button
              block
              variant="ghost"
              onClick={() => {
                setDraft(DEFAULT_FILTERS);
                setFilters(DEFAULT_FILTERS);
              }}
            >
              حذف فیلترها
            </Button>
          </div>
        </div>
      </BottomSheet>

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

/* ------------------------------ کارت چک ------------------------------ */

function ChequeCard({
  cheque,
  partyName,
  onClick,
}: {
  cheque: Cheque;
  partyName: string;
  onClick: () => void;
}) {
  const today = todayIso();
  const overdue = cheque.status === "PENDING" && cheque.dueDate < today;
  const dueSoon =
    cheque.status === "PENDING" && !overdue && cheque.dueDate <= addDays(today, 7);

  return (
    <button type="button" className="inv-card" onClick={onClick}>
      <div className="inv-card__top">
        <Badge tone={TYPE_TONE[cheque.type]}>{CHEQUE_TYPE_LABEL[cheque.type]}</Badge>
        <span className="inv-card__number" dir="ltr">
          {cheque.sayadiNumber ? `صیادی ${faNum(Number(cheque.sayadiNumber.slice(-6)))}` : "بدون صیادی"}
        </span>
      </div>

      <div className="inv-card__total">{faToman(cheque.amount)}</div>
      <div className="inv-card__party">{partyName}</div>
      <div className="inv-card__date">
        {cheque.bank ?? "بانک نامشخص"}
      </div>
      <div
        className={cn(
          "inv-card__date",
          overdue && "ch-due ch-due--overdue",
          dueSoon && "ch-due ch-due--soon"
        )}
      >
        سررسید: {relativeFaDate(cheque.dueDate)} · {faDateLong(cheque.dueDate)}
        {overdue && " · گذشته"}
      </div>

      <div className="inv-card__badges">
        <StatusBadge tone={CHEQUE_STATUS_TONE[cheque.status]} icon={CHEQUE_STATUS_ICON[cheque.status]}>
          {CHEQUE_STATUS_LABEL[cheque.status]}
        </StatusBadge>
      </div>
    </button>
  );
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
