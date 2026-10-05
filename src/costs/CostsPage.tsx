import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Plus,
  SearchX,
  SlidersHorizontal,
} from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { ListItem } from "@/components/ui/Card";
import {
  AmountInput,
  DatePickerTrigger,
  SearchInput,
} from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/Feedback";
import { BottomSheet } from "@/components/ui/Overlay";
import { DateSelectSheet } from "@/components/party/DateSelectSheet";
import { ActivityChart } from "@/components/cost/ActivityChart";
import { useCostStore } from "@/costs/store";
import type { RegisterCostType } from "@/costs/types";
import { normalizeForSearch, presetDateRange } from "@/invoices/helpers";
import type { DateRangePreset } from "@/invoices/helpers";
import { faNum, faTomanCompact, parseAmountDigits, toFaDigits } from "@/lib/fa";
import {
  faDateLong,
  isoToJalali,
  todayIso,
  todayJalali,
} from "@/lib/jalali";
import { cn } from "@/lib/cn";

type TypeTab = "all" | RegisterCostType;

interface CostFilters {
  range: "none" | DateRangePreset;
  customFrom?: string;
  customTo?: string;
  categoryId: string; // "all" or category id
  minAmount?: string; // formatted string
  maxAmount?: string;
}

const DEFAULT_FILTERS: CostFilters = { range: "none", categoryId: "all" };

export function CostsPage() {
  const navigate = useNavigate();
  const { costs, categories, getCategory } = useCostStore();

  const [tab, setTab] = useState<TypeTab>("all");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<CostFilters>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<CostFilters>(DEFAULT_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dateSheet, setDateSheet] = useState<"none" | "from" | "to">("none");

  /* خلاصهٔ ماه جاری */
  const monthSummary = useMemo(() => {
    const today = todayJalali();
    let income = 0;
    let expense = 0;
    for (const cost of costs) {
      const j = isoToJalali(cost.date);
      if (!j || j.jy !== today.jy || j.jm !== today.jm) continue;
      if (cost.type === "INCOME") income += cost.amount;
      else expense += cost.amount;
    }
    return { income, expense, net: income - expense };
  }, [costs]);

  const counts = useMemo(() => {
    const c = { all: costs.length, INCOME: 0, EXPENSE: 0 };
    for (const cost of costs) c[cost.type] += 1;
    return c;
  }, [costs]);

  const filtered = useMemo(() => {
    const q = normalizeForSearch(query);
    const range =
      filters.range === "custom"
        ? { from: filters.customFrom, to: filters.customTo }
        : filters.range === "none"
          ? null
          : presetDateRange(filters.range);
    const min = filters.minAmount ? Number(parseAmountDigits(filters.minAmount)) : null;
    const max = filters.maxAmount ? Number(parseAmountDigits(filters.maxAmount)) : null;

    const list = costs.filter((cost) => {
      if (tab !== "all" && cost.type !== tab) return false;
      if (filters.categoryId !== "all" && cost.categoryId !== filters.categoryId)
        return false;
      if (range) {
        if (range.from && cost.date < range.from) return false;
        if (range.to && cost.date > range.to) return false;
      }
      if (min !== null && cost.amount < min) return false;
      if (max !== null && cost.amount > max) return false;
      if (!q) return true;
      const catName = getCategory(cost.categoryId)?.name ?? "";
      return (
        normalizeForSearch(cost.title).includes(q) ||
        (!!cost.description && normalizeForSearch(cost.description).includes(q)) ||
        normalizeForSearch(catName).includes(q)
      );
    });

    return [...list].sort(
      (a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [costs, tab, query, filters]);

  /* گروه‌بندی بر اساس روز */
  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const cost of filtered) {
      const key = cost.date;
      const arr = map.get(key);
      if (arr) arr.push(cost);
      else map.set(key, [cost]);
    }
    return [...map.entries()];
  }, [filtered]);

  const activeChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];
    if (filters.range !== "none") {
      chips.push({
        id: "range",
        label: `بازه: ${
          filters.range === "custom"
            ? "بازه دلخواه"
            : filters.range === "today"
              ? "امروز"
              : filters.range === "week"
                ? "این هفته"
                : "این ماه"
        }`,
        onRemove: () => setFilters((f) => ({ ...f, range: "none" })),
      });
    }
    if (filters.categoryId !== "all") {
      chips.push({
        id: "category",
        label: `دسته: ${getCategory(filters.categoryId)?.name ?? "—"}`,
        onRemove: () => setFilters((f) => ({ ...f, categoryId: "all" })),
      });
    }
    if (filters.minAmount || filters.maxAmount) {
      chips.push({
        id: "amount",
        label: `مبلغ: ${filters.minAmount ? `از ${filters.minAmount}` : ""}${
          filters.minAmount && filters.maxAmount ? " تا " : ""
        }${filters.maxAmount ? filters.maxAmount : ""} تومان`,
        onRemove: () =>
          setFilters((f) => ({ ...f, minAmount: undefined, maxAmount: undefined })),
      });
    }
    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return (
    <>
      <PageHeader
        title="هزینه‌ها و درآمدها"
        subtitle="ثبت هزینه‌ها و درآمدهای عمومی کسب‌وکار"
        actions={
          <Button
            size="sm"
            icon={<Plus size={18} aria-hidden />}
            onClick={() => navigate("/costs/add")}
          >
            ثبت
          </Button>
        }
      />

      <div className="page">
        {/* خلاصهٔ ماه جاری */}
        <div className="ch-summary" aria-label="خلاصهٔ ماه جاری">
          <div className="ch-summary__tile ch-summary__tile--success">
            <span className="ch-summary__label">درآمد این ماه</span>
            <strong>{faTomanCompact(monthSummary.income)}</strong>
          </div>
          <div className="ch-summary__tile ch-summary__tile--error">
            <span className="ch-summary__label">هزینهٔ این ماه</span>
            <strong>{faTomanCompact(monthSummary.expense)}</strong>
          </div>
          <div
            className={cn(
              "ch-summary__tile",
              monthSummary.net >= 0
                ? "ch-summary__tile--success"
                : "ch-summary__tile--error"
            )}
          >
            <span className="ch-summary__label">خالص این ماه</span>
            <strong>{faTomanCompact(monthSummary.net)}</strong>
          </div>
        </div>

        {/* نمودار فعالیت */}
        <div className="card mt-4">
          <ActivityChart costs={costs} />
        </div>

        <Tabs
          className="mt-4"
          ariaLabel="نوع رکورد"
          tabs={[
            { id: "all", label: "همه", count: counts.all },
            { id: "EXPENSE", label: "هزینه", count: counts.EXPENSE },
            { id: "INCOME", label: "درآمد", count: counts.INCOME },
          ]}
          active={tab}
          onChange={(id) => setTab(id as TypeTab)}
        />

        <div className="party-controls-row">
          <SearchInput
            value={query}
            placeholder="جستجو در عنوان، توضیح یا دسته"
            onValueChange={setQuery}
            aria-label="جستجوی هزینه و درآمد"
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

        {costs.length === 0 ? (
          <div className="card mt-4" style={{ paddingInline: 0, paddingBlock: "var(--space-2)" }}>
            <EmptyState
              icon={<PiggyBank size={32} aria-hidden />}
              title="هنوز رکوردی ثبت نکرده‌اید"
              description="هزینه‌ها و درآمدهای کسب‌وکار خود را ثبت کنید تا تصویر روشنی از جریان پول داشته باشید."
              actions={
                <Button icon={<Plus size={18} aria-hidden />} onClick={() => navigate("/costs/add")}>
                  ثبت هزینه یا درآمد
                </Button>
              }
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card mt-4" style={{ paddingInline: 0, paddingBlock: "var(--space-2)" }}>
            <EmptyState
              icon={<SearchX size={30} aria-hidden />}
              title="نتیجه‌ای پیدا نشد"
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
          <div className="stack mt-4" style={{ gap: "var(--space-5)" }}>
            {groups.map(([date, list]) => (
              <section key={date} aria-label={faDateLong(date)}>
                <h2 className="group-heading">{faDateLong(date)}</h2>
                <div className="list">
                  {list.map((cost) => {
                    const cat = getCategory(cost.categoryId);
                    const isIncome = cost.type === "INCOME";
                    return (
                      <ListItem
                        key={cost.id}
                        tintIcon
                        icon={
                          isIncome ? (
                            <ArrowUpRight size={18} aria-hidden />
                          ) : (
                            <ArrowDownLeft size={18} aria-hidden />
                          )
                        }
                        title={cost.title}
                        caption={`${cat?.name ?? "بدون دسته"} · ساعت ${toFaDigits(cost.time)}`}
                        end={
                          <span className="stack" style={{ gap: 2 }}>
                            <strong
                              className={isIncome ? "fin-income-text" : "fin-expense-text"}
                            >
                              {isIncome ? "+" : "−"}
                              {faNum(cost.amount)}
                            </strong>
                            <span className="text-muted text-xs">تومان</span>
                          </span>
                        }
                        chevron
                        onClick={() => navigate(`/costs/${cost.id}`)}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* برگهٔ فیلترها */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="فیلتر هزینه‌ها و درآمدها">
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
              ] as Array<{ value: CostFilters["range"]; label: string }>
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
        </div>

        <div className="sheet-section">
          <div className="sheet-label">دسته</div>
          <div className="list">
            <ListItem
              title="همهٔ دسته‌ها"
              className={cn(draft.categoryId === "all" && "is-picked")}
              onClick={() => setDraft((d) => ({ ...d, categoryId: "all" }))}
            />
            {categories.map((cat) => (
              <ListItem
                key={cat.id}
                title={`${cat.name} (${cat.kind === "EXPENSE" ? "هزینه" : "درآمد"})`}
                className={cn(draft.categoryId === cat.id && "is-picked")}
                onClick={() => setDraft((d) => ({ ...d, categoryId: cat.id }))}
              />
            ))}
          </div>
        </div>

        <div className="sheet-section">
          <div className="sheet-label">محدودهٔ مبلغ (تومان)</div>
          <div className="grid-2">
            <AmountInput
              value={draft.minAmount ?? ""}
              onValueChange={(v) => setDraft((d) => ({ ...d, minAmount: v || undefined }))}
              placeholder="حداقل"
            />
            <AmountInput
              value={draft.maxAmount ?? ""}
              onValueChange={(v) => setDraft((d) => ({ ...d, maxAmount: v || undefined }))}
              placeholder="حداکثر"
            />
          </div>
        </div>

        <div className="sticky-footer">
          <Button
            block
            onClick={() => {
              setFilters(draft);
              setSheetOpen(false);
            }}
          >
            اعمال فیلترها
          </Button>
          <Button variant="ghost" block onClick={() => setFilters(DEFAULT_FILTERS)}>
            حذف همهٔ فیلترها
          </Button>
        </div>
      </BottomSheet>

      <DateSelectSheet
        open={dateSheet === "from"}
        onClose={() => setDateSheet("none")}
        title="از تاریخ"
        value={draft.customFrom ?? todayIso()}
        onSelect={(iso) => {
          setDraft((d) => ({ ...d, customFrom: iso }));
          setDateSheet("none");
        }}
      />
      <DateSelectSheet
        open={dateSheet === "to"}
        onClose={() => setDateSheet("none")}
        title="تا تاریخ"
        value={draft.customTo ?? todayIso()}
        onSelect={(iso) => {
          setDraft((d) => ({ ...d, customTo: iso }));
          setDateSheet("none");
        }}
      />
    </>
  );
}
