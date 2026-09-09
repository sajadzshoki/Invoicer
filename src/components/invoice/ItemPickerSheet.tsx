import { useEffect, useMemo, useState } from "react";
import { Clock, Package, SearchX, Wrench } from "lucide-react";
import { BottomSheet } from "@/components/ui/Overlay";
import { SearchInput, Select } from "@/components/ui/Field";
import { ListItem } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Feedback";
import { useInventoryStore } from "@/inventory/store";
import { useInvoiceStore } from "@/invoices/store";
import type { InvoiceType } from "@/invoices/types";
import type { Product } from "@/inventory/types";
import { normalizeForSearch } from "@/invoices/helpers";
import { faNum, faToman, toEnDigits } from "@/lib/fa";
import { cn } from "@/lib/cn";

type PickerTypeFilter = "all" | "PRODUCT" | "SERVICE";

export interface ItemPickerSheetProps {
  open: boolean;
  onClose: () => void;
  /** قیمت پیش‌فرض بر اساس نوع فاکتور انتخاب می‌شود */
  invoiceType: InvoiceType;
  /** قلم‌هایی که از قبل در فاکتور هستند — غیرفعال نمایش داده می‌شوند */
  disabledIds?: string[];
  onPick: (product: Product) => void;
}

/**
 * برگهٔ انتخاب کالا/خدمت برای فاکتور:
 * جستجو روی نام و بارکد، فیلتر نوع و دسته، و «اخیراً استفاده‌شده».
 */
export function ItemPickerSheet({
  open,
  onClose,
  invoiceType,
  disabledIds = [],
  onPick,
}: ItemPickerSheetProps) {
  const { products, categories } = useInventoryStore();
  const { invoices } = useInvoiceStore();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<PickerTypeFilter>("all");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setQuery("");
    setTypeFilter("all");
    setCategoryId("");
    const t = window.setTimeout(() => setLoading(false), 500);
    return () => window.clearTimeout(t);
  }, [open]);

  /** قلم‌هایی که در فاکتورهای اخیر استفاده شده‌اند */
  const recentIds = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    const sorted = [...invoices].sort((a, b) => b.date.localeCompare(a.date));
    for (const inv of sorted) {
      for (const item of inv.items) {
        if (!seen.has(item.productId)) {
          seen.add(item.productId);
          ordered.push(item.productId);
        }
        if (ordered.length >= 5) break;
      }
      if (ordered.length >= 5) break;
    }
    return ordered;
  }, [invoices]);

  const filtered = useMemo(() => {
    const q = normalizeForSearch(query);
    const qDigits = toEnDigits(query).replace(/\D/g, "");
    return products.filter((p) => {
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (categoryId && p.categoryId !== categoryId) return false;
      if (!q) return true;
      const byName = normalizeForSearch(p.name).includes(q);
      const byBarcode =
        !!qDigits && !!p.barcode && p.barcode.includes(qDigits);
      return byName || byBarcode;
    });
  }, [products, query, typeFilter, categoryId]);

  const recent = useMemo(
    () =>
      recentIds
        .map((id) => filtered.find((p) => p.id === id))
        .filter((p): p is Product => !!p)
        .slice(0, 4),
    [recentIds, filtered]
  );

  const renderItem = (p: Product) => {
    const inInvoice = disabledIds.includes(p.id);
    const category = categories.find((c) => c.id === p.categoryId);
    return (
      <ListItem
        key={p.id}
        avatar={
          p.image ? (
            <img className="item-thumb" src={p.image} alt={p.name} />
          ) : (
            <span className="item-thumb item-thumb--placeholder" aria-hidden>
              {p.type === "PRODUCT" ? (
                <Package size={20} />
              ) : (
                <Wrench size={20} />
              )}
            </span>
          )
        }
        title={p.name}
        caption={
          p.type === "PRODUCT" ? (
            <>
              موجودی: {faNum(p.currentStock ?? 0)} {p.unit ?? ""}
              {category ? ` · ${category.name}` : ""}
            </>
          ) : (
            category?.name ?? "خدمت"
          )
        }
        end={
          <span className="picker-price">
            {inInvoice ? (
              <span className="badge badge--sm">در فاکتور</span>
            ) : (
              faToman(pickDefaultUnitPrice(p, invoiceType))
            )}
          </span>
        }
        onClick={inInvoice ? undefined : () => onPick(p)}
        className={cn(inInvoice && "is-disabled-row")}
      />
    );
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="افزودن قلم به فاکتور">
      <SearchInput
        value={query}
        placeholder="جستجوی نام یا بارکد"
        onValueChange={setQuery}
      />

      {/* فیلتر نوع */}
      <div className="chip-row mt-3" role="radiogroup" aria-label="نوع قلم">
        {(
          [
            { id: "all", label: "همه" },
            { id: "PRODUCT", label: "کالا" },
            { id: "SERVICE", label: "خدمت" },
          ] as Array<{ id: PickerTypeFilter; label: string }>
        ).map((chip) => (
          <button
            key={chip.id}
            type="button"
            role="radio"
            aria-checked={typeFilter === chip.id}
            className={cn("chip chip--sm", typeFilter === chip.id && "is-active")}
            onClick={() => setTypeFilter(chip.id)}
          >
            {chip.label}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <Select
          aria-label="فیلتر دسته‌بندی"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="picker-cat-select"
        >
          <option value="">همهٔ دسته‌ها</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="stack" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Skeleton width={56} height={56} />
                <div style={{ flex: 1 }}>
                  <Skeleton width="50%" height={14} />
                  <Skeleton width="35%" height={11} className="mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="picker-empty">
            <SearchX size={26} aria-hidden />
            <p>
              {query
                ? `قلمی مطابق «${query}» پیدا نشد.`
                : "با این فیلتر قلمی پیدا نشد."}
            </p>
          </div>
        ) : (
          <>
            {recent.length > 0 && !query && (
              <>
                <div className="picker-group-label">
                  <Clock size={14} aria-hidden />
                  اخیراً استفاده‌شده
                </div>
                <div className="list">{recent.map(renderItem)}</div>
                <div className="picker-group-label mt-4">همهٔ اقلام</div>
              </>
            )}
            <div className="list">
              {filtered.map(renderItem)}
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}

/**
 * قیمت واحد پیش‌فرض هنگام افزودن قلم:
 * فروش/پیش‌فاکتور ← قیمت فروش، خرید ← قیمت خرید، خدمت ← فی.
 * (فقط پیش‌فرض است؛ در فرم فاکتور قابل ویرایش است و قیمت خودِ کالا تغییر نمی‌کند.)
 */
export function pickDefaultUnitPrice(
  product: Product,
  invoiceType: InvoiceType
): number {
  if (product.type === "SERVICE") return product.servicePrice ?? 0;
  if (invoiceType === "BUY") return product.purchasePrice ?? 0;
  return product.salePrice ?? 0;
}
