import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownUp,
  Check,
  Globe,
  ListFilter,
  Package,
  PackageSearch,
  Plus,
  Search,
  Tags,
  Wrench,
} from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { Button, IconButton } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { BottomSheet } from "@/components/ui/Overlay";
import { Tabs } from "@/components/ui/Tabs";
import { ListItem } from "@/components/ui/Card";
import { useInventoryStore } from "@/inventory/store";
import {
  getStockStatus,
  itemPrice,
  STOCK_STATUS_LABEL,
  TYPE_LABEL,
  type StockStatus,
} from "@/inventory/helpers";
import type { Product } from "@/inventory/types";
import { StockStatusBadge } from "@/components/product/StockStatusBadge";
import { CategoriesSheet } from "@/components/product/CategoriesSheet";
import { faNum, faToman, toEnDigits } from "@/lib/fa";

type TypeTab = "all" | "PRODUCT" | "SERVICE";
type StockFilter = "all" | StockStatus;
type SortKey = "recent" | "name" | "price" | "stock";

const STOCK_FILTERS: Array<{ id: StockFilter; label: string }> = [
  { id: "all", label: "همه" },
  { id: "in", label: "موجود" },
  { id: "low", label: "رو به اتمام" },
  { id: "out", label: "ناموجود" },
];

const SORT_OPTIONS: Array<{ id: SortKey; label: string }> = [
  { id: "recent", label: "جدیدترین" },
  { id: "name", label: "نام (الفبا)" },
  { id: "price", label: "قیمت" },
  { id: "stock", label: "موجودی" },
];

export function ProductsPage() {
  const navigate = useNavigate();
  const { products, categories } = useInventoryStore();

  const [tab, setTab] = useState<TypeTab>("all");
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);
  const [stockSheetOpen, setStockSheetOpen] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [categoriesManageOpen, setCategoriesManageOpen] = useState(false);

  const counts = useMemo(
    () => ({
      all: products.length,
      PRODUCT: products.filter((p) => p.type === "PRODUCT").length,
      SERVICE: products.filter((p) => p.type === "SERVICE").length,
    }),
    [products]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = toEnDigits(q);

    let list = products.filter((item) => {
      if (tab !== "all" && item.type !== tab) return false;
      if (tab !== "SERVICE" && stockFilter !== "all" && item.type === "PRODUCT") {
        if (getStockStatus(item) !== stockFilter) return false;
      }
      if (categoryFilter !== "all" && item.categoryId !== categoryFilter) return false;
      if (!q) return true;
      const nameMatch = item.name.toLowerCase().includes(q);
      const barcodeMatch =
        !!qDigits && !!item.barcode && item.barcode.includes(qDigits);
      return nameMatch || barcodeMatch;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name, "fa");
        case "price":
          return itemPrice(b) - itemPrice(a);
        case "stock": {
          const sa = a.type === "PRODUCT" ? a.currentStock ?? 0 : -1;
          const sb = b.type === "PRODUCT" ? b.currentStock ?? 0 : -1;
          return sb - sa;
        }
        case "recent":
        default:
          return b.createdAt.localeCompare(a.createdAt);
      }
    });
    return list;
  }, [products, tab, query, stockFilter, categoryFilter, sort]);

  const hasActiveControls =
    query.trim() !== "" ||
    stockFilter !== "all" ||
    categoryFilter !== "all" ||
    sort !== "recent";

  const clearControls = () => {
    setQuery("");
    setStockFilter("all");
    setCategoryFilter("all");
    setSort("recent");
  };

  const openAdd = (type: "PRODUCT" | "SERVICE") =>
    navigate(`/products/add?type=${type}`);

  const categoryName = (id?: string) =>
    categories.find((c) => c.id === id)?.name;

  const tabEmpty = tab === "SERVICE" && counts.SERVICE === 0;
  const productsEmpty = tab !== "SERVICE" && counts.PRODUCT === 0 && tab !== "all";
  const allEmpty = counts.all === 0;

  return (
    <>
      <PageHeader
        title="کالاها و خدمات"
        subtitle="مدیریت اقلام، موجودی و قیمت‌ها"
        actions={
          <>
            <IconButton
              label="مدیریت دسته‌بندی‌ها"
              tone="filled"
              onClick={() => setCategoriesManageOpen(true)}
            >
              <Tags size={20} aria-hidden />
            </IconButton>
            <Button size="sm" icon={<Plus size={18} aria-hidden />} onClick={() => setTypeSheetOpen(true)}>
              افزودن
            </Button>
          </>
        }
      />

      <div className="page">
        <Tabs
          ariaLabel="نوع اقلام"
          tabs={[
            { id: "all", label: "همه", count: counts.all },
            { id: "PRODUCT", label: "کالاها", count: counts.PRODUCT },
            { id: "SERVICE", label: "خدمات", count: counts.SERVICE },
          ]}
          active={tab}
          onChange={(id) => setTab(id as TypeTab)}
        />

        {/* ابزارهای جست‌وجو و فیلتر */}
        <div className="party-toolbar mt-4">
          <SearchInput
            className="party-toolbar__search"
            value={query}
            onValueChange={setQuery}
            placeholder="جست‌وجوی نام یا بارکد…"
            aria-label="جست‌وجوی کالا و خدمت"
          />
          <div className="party-toolbar__btns">
            {tab !== "SERVICE" && (
              <IconButton
                label="فیلتر موجودی"
                tone={stockFilter !== "all" ? "tint" : "filled"}
                onClick={() => setStockSheetOpen(true)}
              >
                <PackageSearch size={20} aria-hidden />
              </IconButton>
            )}
            <IconButton
              label="فیلتر دسته‌بندی"
              tone={categoryFilter !== "all" ? "tint" : "filled"}
              onClick={() => setCategorySheetOpen(true)}
            >
              <ListFilter size={20} aria-hidden />
            </IconButton>
            <IconButton
              label="مرتب‌سازی"
              tone={sort !== "recent" ? "tint" : "filled"}
              onClick={() => setSortSheetOpen(true)}
            >
              <ArrowDownUp size={20} aria-hidden />
            </IconButton>
          </div>
        </div>

        {hasActiveControls && (
          <div className="party-controls-row">
            {categoryFilter !== "all" && (
              <button type="button" className="control-chip" onClick={() => setCategoryFilter("all")}>
                {categoryName(categoryFilter) ?? "دسته"}
                <Tags size={13} aria-hidden />
              </button>
            )}
            {stockFilter !== "all" && (
              <button type="button" className="control-chip" onClick={() => setStockFilter("all")}>
                {STOCK_STATUS_LABEL[stockFilter]}
              </button>
            )}
            {sort !== "recent" && (
              <button type="button" className="control-chip" onClick={() => setSort("recent")}>
                مرتب‌سازی: {SORT_OPTIONS.find((s) => s.id === sort)?.label}
              </button>
            )}
            <Button variant="text" size="sm" onClick={clearControls}>
              حذف همهٔ فیلترها
            </Button>
          </div>
        )}

        {/* محتوا */}
        {allEmpty ? (
          <EmptyCard>
            <EmptyState
              icon={<Package size={32} aria-hidden />}
              title="هنوز کالایی ثبت نکرده‌اید"
              description="کالاهای خود را اضافه کنید تا موجودی و قیمت آن‌ها را مدیریت کنید."
              actions={
                <>
                  <Button icon={<Plus size={18} aria-hidden />} onClick={() => openAdd("PRODUCT")}>
                    افزودن کالا
                  </Button>
                  <Button variant="ghost" icon={<Wrench size={18} aria-hidden />} onClick={() => openAdd("SERVICE")}>
                    افزودن خدمت
                  </Button>
                </>
              }
            />
          </EmptyCard>
        ) : tabEmpty ? (
          <EmptyCard>
            <EmptyState
              icon={<Wrench size={32} aria-hidden />}
              title="هنوز خدمتی ثبت نکرده‌اید"
              description="خدمات خود را تعریف کنید تا هنگام ثبت فاکتور سریع‌تر انتخاب شوند."
              actions={
                <Button icon={<Plus size={18} aria-hidden />} onClick={() => openAdd("SERVICE")}>
                  افزودن خدمت
                </Button>
              }
            />
          </EmptyCard>
        ) : productsEmpty ? (
          <EmptyCard>
            <EmptyState
              icon={<Package size={32} aria-hidden />}
              title="هنوز کالایی ثبت نکرده‌اید"
              description="کالاهای خود را اضافه کنید تا موجودی و قیمت آن‌ها را مدیریت کنید."
              actions={
                <Button icon={<Plus size={18} aria-hidden />} onClick={() => openAdd("PRODUCT")}>
                  افزودن کالا
                </Button>
              }
            />
          </EmptyCard>
        ) : visible.length === 0 ? (
          <EmptyCard>
            <EmptyState
              icon={<Search size={30} aria-hidden />}
              title="نتیجه‌ای پیدا نشد"
              description={
                query.trim()
                  ? `برای «${query.trim()}» قلمی با این فیلترها پیدا نشد.`
                  : "هیچ قلمی با این فیلترها وجود ندارد."
              }
              actions={
                <Button variant="secondary" onClick={clearControls}>
                  پاک‌کردن جست‌وجو و فیلترها
                </Button>
              }
            />
          </EmptyCard>
        ) : (
          <div className="item-grid">
            {visible.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                categoryName={categoryName(item.categoryId)}
                onClick={() => navigate(`/products/${item.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* برگهٔ انتخاب نوع برای افزودن */}
      <BottomSheet
        open={typeSheetOpen}
        onClose={() => setTypeSheetOpen(false)}
        title="چه چیزی اضافه می‌کنید؟"
      >
        <div className="stack">
          <button type="button" className="type-pick" onClick={() => { setTypeSheetOpen(false); openAdd("PRODUCT"); }}>
            <span className="type-pick__icon type-pick__icon--product" aria-hidden>
              <Package size={22} />
            </span>
            <span className="type-pick__body">
              <span className="type-pick__title">کالا</span>
              <span className="type-pick__caption">قلم فیزیکی با موجودی، واحد و قیمت خرید و فروش</span>
            </span>
          </button>
          <button type="button" className="type-pick" onClick={() => { setTypeSheetOpen(false); openAdd("SERVICE"); }}>
            <span className="type-pick__icon type-pick__icon--service" aria-hidden>
              <Wrench size={22} />
            </span>
            <span className="type-pick__body">
              <span className="type-pick__title">خدمت</span>
              <span className="type-pick__caption">کار یا سرویس با فی مشخص، بدون موجودی</span>
            </span>
          </button>
        </div>
      </BottomSheet>

      {/* برگهٔ فیلتر موجودی */}
      <BottomSheet
        open={stockSheetOpen}
        onClose={() => setStockSheetOpen(false)}
        title="وضعیت موجودی"
      >
        <div className="list">
          {STOCK_FILTERS.map((option) => (
            <ListItem
              key={option.id}
              title={option.label}
              end={stockFilter === option.id ? <Check size={20} aria-hidden /> : undefined}
              onClick={() => {
                setStockFilter(option.id);
                setStockSheetOpen(false);
              }}
            />
          ))}
        </div>
      </BottomSheet>

      {/* برگهٔ فیلتر دسته‌بندی */}
      <BottomSheet
        open={categorySheetOpen}
        onClose={() => setCategorySheetOpen(false)}
        title="دسته‌بندی"
      >
        <div className="list">
          <ListItem
            title="همهٔ دسته‌ها"
            end={categoryFilter === "all" ? <Check size={20} aria-hidden /> : undefined}
            onClick={() => {
              setCategoryFilter("all");
              setCategorySheetOpen(false);
            }}
          />
          {categories.map((cat) => (
            <ListItem
              key={cat.id}
              icon={<Tags size={18} aria-hidden />}
              title={cat.name}
              end={categoryFilter === cat.id ? <Check size={20} aria-hidden /> : undefined}
              onClick={() => {
                setCategoryFilter(cat.id);
                setCategorySheetOpen(false);
              }}
            />
          ))}
        </div>
        <div className="sheet-section">
          <Button block variant="secondary" onClick={() => { setCategorySheetOpen(false); setCategoriesManageOpen(true); }}>
            مدیریت دسته‌بندی‌ها
          </Button>
        </div>
      </BottomSheet>

      {/* برگهٔ مرتب‌سازی */}
      <BottomSheet
        open={sortSheetOpen}
        onClose={() => setSortSheetOpen(false)}
        title="مرتب‌سازی"
      >
        <div className="list">
          {SORT_OPTIONS.map((option) => (
            <ListItem
              key={option.id}
              title={option.label}
              end={sort === option.id ? <Check size={20} aria-hidden /> : undefined}
              onClick={() => {
                setSort(option.id);
                setSortSheetOpen(false);
              }}
            />
          ))}
        </div>
      </BottomSheet>

      <CategoriesSheet
        open={categoriesManageOpen}
        onClose={() => setCategoriesManageOpen(false)}
      />
    </>
  );
}

/* ------------------------------ کارت قلم ------------------------------ */

function ItemCard({
  item,
  categoryName,
  onClick,
}: {
  item: Product;
  categoryName?: string;
  onClick: () => void;
}) {
  const isProduct = item.type === "PRODUCT";
  const status = isProduct ? getStockStatus(item) : null;

  return (
    <button type="button" className="party-card" onClick={onClick}>
      {item.image ? (
        <img className="item-thumb" src={item.image} alt={item.name} />
      ) : (
        <span className="item-thumb item-thumb--placeholder" aria-hidden>
          {isProduct ? <Package size={22} /> : <Wrench size={22} />}
        </span>
      )}

      <div className="party-card__body">
        <div className="party-card__top">
          <span className="party-card__name">{item.name}</span>
          {status && <StockStatusBadge status={status} size="sm" />}
          {!isProduct && item.showInOnlinePriceList && (
            <Badge tone="primary" className="badge--sm"><Globe size={11} aria-hidden /> لیست قیمت</Badge>
          )}
        </div>
        <span className="party-card__meta">
          {TYPE_LABEL[item.type]}
          {categoryName ? ` · ${categoryName}` : ""}
        </span>
        {isProduct && (
          <span className="party-card__meta">
            موجودی: {faNum(item.currentStock ?? 0)} {item.unit ?? ""}
          </span>
        )}
      </div>

      <div className="party-card__balance">
        <span className="party-card__amount">{faToman(itemPrice(item))}</span>
        <span className="party-card__balance-label">
          {isProduct ? "قیمت فروش" : "فی خدمت"}
        </span>
        {isProduct && item.showInOnlinePriceList && (
          <Badge tone="primary" className="badge--sm mt-2">
            <Globe size={11} aria-hidden /> لیست قیمت
          </Badge>
        )}
      </div>
    </button>
  );
}

/* ------------------------------ اسکلت و قاب خالی ------------------------------ */

function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="card mt-6" style={{ paddingInline: 0, paddingBlock: "var(--space-2)" }}>
      {children}
    </div>
  );
}
