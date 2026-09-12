import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Globe,
  GlobeLock,
  MoreVertical,
  Package,
  Pencil,
  Search,
  Trash2,
  Warehouse,
  Wrench,
} from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { Badge } from "@/components/ui/Card";
import { Button, IconButton } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/Tabs";
import {
  Alert,
  EmptyState,
  ErrorState,
  Skeleton,
} from "@/components/ui/Feedback";
import { BottomSheet, Modal } from "@/components/ui/Overlay";
import { ListItem } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { useInventoryStore } from "@/inventory/store";
import { useInvoiceStore } from "@/invoices/store";
import {
  computeStockTotals,
  getStockStatus,
  TYPE_LABEL,
} from "@/inventory/helpers";
import type { StockMovement } from "@/inventory/types";
import { StockStatusBadge } from "@/components/product/StockStatusBadge";
import { StockMovementSheet } from "@/components/product/StockMovementSheet";
import { faNum, faToman } from "@/lib/fa";
import { faDateLong, relativeFaDate } from "@/lib/jalali";
import { cn } from "@/lib/cn";

type MovementTab = "all" | "ENTRY" | "EXIT";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const store = useInventoryStore();
  const invoiceStore = useInvoiceStore();
  const { products, categories, movements } = store;

  const item = products.find((p) => p.id === id);
  const isProduct = item?.type === "PRODUCT";

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 600);
    return () => window.clearTimeout(t);
  }, [id]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [movement, setMovement] = useState<{ open: boolean; kind: "ENTRY" | "EXIT" }>({
    open: false,
    kind: "ENTRY",
  });
  const [movementTab, setMovementTab] = useState<MovementTab>("all");

  const itemMovements = useMemo(
    () =>
      movements
        .filter((m) => m.productId === id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [movements, id]
  );
  const totals = useMemo(() => computeStockTotals(itemMovements), [itemMovements]);
  const visibleMovements = useMemo(
    () =>
      movementTab === "all"
        ? itemMovements
        : itemMovements.filter((m) => m.type === movementTab),
    [itemMovements, movementTab]
  );

  if (loading) {
    return (
      <>
        <PageHeader title="…" onBack />
        <div className="page">
          <DetailSkeleton />
        </div>
      </>
    );
  }

  if (!item) {
    return (
      <>
        <PageHeader title="جزئیات" onBack />
        <div className="page">
          <ErrorState
            title="قلم پیدا نشد"
            description="ممکن است این کالا یا خدمت حذف شده باشد."
            action={<Button onClick={() => navigate("/products")}>بازگشت به فهرست</Button>}
          />
        </div>
      </>
    );
  }

  const status = isProduct ? getStockStatus(item) : null;
  const category = categories.find((c) => c.id === item.categoryId);

  /* فاکتورهایی که به این قلم ارجاع دارند — برای حفاظت از حذف */
  const referencedInvoices = useMemo(
    () =>
      invoiceStore.invoices.filter((inv) =>
        inv.items.some((it) => it.productId === item.id)
      ),
    [invoiceStore.invoices, item.id]
  );
  const hasInvoiceHistory = referencedInvoices.length > 0;

  const doDelete = () => {
    store.deleteProduct(item.id);
    setDeleteOpen(false);
    showToast({
      variant: "success",
      title: `${TYPE_LABEL[item.type]} حذف شد`,
      description: `«${item.name}» حذف شد.`,
    });
    navigate("/products");
  };

  return (
    <>
      <PageHeader
        title={item.name}
        subtitle={`${TYPE_LABEL[item.type]}${category ? ` · ${category.name}` : ""}`}
        onBack
        actions={
          <>
            <Button
              size="sm"
              variant="secondary"
              icon={<Pencil size={16} aria-hidden />}
              onClick={() => navigate(`/products/add?id=${item.id}`)}
            >
              ویرایش
            </Button>
            <IconButton label="گزینه‌های بیشتر" tone="filled" onClick={() => setMenuOpen(true)}>
              <MoreVertical size={20} aria-hidden />
            </IconButton>
          </>
        }
      />

      <div className="page">
        {/* پروفایل */}
        <section aria-label="پروفایل قلم">
          <div className="party-profile">
            {item.image ? (
              <img className="item-thumb item-thumb--lg" src={item.image} alt={item.name} />
            ) : (
              <span className="item-thumb item-thumb--lg item-thumb--placeholder" aria-hidden>
                {isProduct ? <Package size={28} /> : <Wrench size={28} />}
              </span>
            )}
            <div className="party-profile__body">
              <div className="party-profile__row">
                <h2 className="party-profile__name">{item.name}</h2>
                {status && <StockStatusBadge status={status} />}
              </div>
              <div className="party-profile__row">
                <Badge tone={isProduct ? "primary" : "info"}>{TYPE_LABEL[item.type]}</Badge>
                {category && <Badge tone="neutral">{category.name}</Badge>}
                {item.showInOnlinePriceList ? (
                  <Badge tone="success"><Globe size={12} aria-hidden /> نمایش در لیست قیمت</Badge>
                ) : (
                  <Badge tone="outline"><GlobeLock size={12} aria-hidden /> عدم نمایش</Badge>
                )}
              </div>
              {item.description && (
                <p className="party-profile__meta" style={{ lineHeight: "var(--leading-relaxed)" }}>
                  {item.description}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* مشخصات */}
        <section className="page__section" aria-label="مشخصات">
          <div className="section-head">
            <h2>مشخصات</h2>
          </div>
          <div className="spec-list">
            {isProduct ? (
              <>
                <SpecRow label="بارکد">
                  {item.barcode ? (
                    <span dir="ltr" className="spec-list__ltr">{item.barcode}</span>
                  ) : (
                    <span className="spec-list__empty">ثبت نشده</span>
                  )}
                </SpecRow>
                <SpecRow label="واحد">{item.unit ?? "—"}</SpecRow>
                <SpecRow label="قیمت خرید">{faToman(item.purchasePrice ?? 0)}</SpecRow>
                <SpecRow label="قیمت فروش">
                  <strong>{faToman(item.salePrice ?? 0)}</strong>
                </SpecRow>
                <SpecRow label="نقطهٔ سفارش">
                  {item.reorderPoint !== undefined
                    ? `${faNum(item.reorderPoint)} ${item.unit ?? ""}`
                    : "تعیین نشده"}
                </SpecRow>
                {item.showInOnlinePriceList && (
                  <SpecRow label="حداقل تعداد سفارش">
                    {item.minimumOrderQuantity !== undefined
                      ? `${faNum(item.minimumOrderQuantity)} ${item.unit ?? ""}`
                      : "۱"}
                  </SpecRow>
                )}
              </>
            ) : (
              <SpecRow label="فی خدمت">
                <strong>{faToman(item.servicePrice ?? 0)}</strong>
              </SpecRow>
            )}
            <SpecRow label="نمایش در لیست قیمت آنلاین">
              {item.showInOnlinePriceList ? "فعال" : "غیرفعال"}
            </SpecRow>
          </div>
        </section>

        {/* خلاصهٔ موجودی و اقدامات — فقط کالا */}
        {isProduct && (
          <>
            <section className="page__section" aria-label="خلاصهٔ موجودی">
              <div className="section-head">
                <h2>خلاصهٔ موجودی</h2>
                {status && <StockStatusBadge status={status} size="sm" />}
              </div>
              <div className="stock-summary">
                <div className="stock-summary__hero">
                  <span className="balance-hero__label">موجودی فعلی</span>
                  <p className="stock-summary__amount">
                    {faNum(item.currentStock ?? 0)}
                    <span className="amount-unit">{item.unit ?? ""}</span>
                  </p>
                  {status === "low" && (
                    <span className="stock-summary__warn">موجودی رو به اتمام است؛ به نقطهٔ سفارش رسیده.</span>
                  )}
                  {status === "out" && (
                    <span className="stock-summary__warn">این کالا ناموجود است.</span>
                  )}
                </div>
                <div className="fin-tiles" style={{ marginTop: 0 }}>
                  <div className="fin-tile fin-tile--success">
                    <span className="fin-tile__label">مجموع ورود</span>
                    <span className="fin-tile__value">{faNum(totals.totalEntry)}</span>
                    <span className="fin-tile__unit">{item.unit ?? ""}</span>
                  </div>
                  <div className="fin-tile fin-tile--error">
                    <span className="fin-tile__label">مجموع خروج</span>
                    <span className="fin-tile__value">{faNum(totals.totalExit)}</span>
                    <span className="fin-tile__unit">{item.unit ?? ""}</span>
                  </div>
                </div>
              </div>
              <p className="fin-note">
                حرکات ورود و خروج فقط موجودی انبار را تغییر می‌دهند و اثر مالی (حساب طرف حساب، طلب/بدهی، درآمد/هزینه) ندارند.
              </p>
            </section>

            <section className="page__section" aria-label="اقدامات انبار">
              <div className="action-stack">
                <Button
                  size="lg"
                  block
                  icon={<ArrowDownToLine size={20} aria-hidden />}
                  onClick={() => setMovement({ open: true, kind: "ENTRY" })}
                >
                  ورود کالا
                </Button>
                <Button
                  size="lg"
                  block
                  variant="secondary"
                  icon={<ArrowUpFromLine size={20} aria-hidden />}
                  onClick={() => setMovement({ open: true, kind: "EXIT" })}
                >
                  خروج کالا
                </Button>
              </div>
            </section>

            <section className="page__section" aria-label="حرکات انبار">
              <div className="section-head">
                <h2>حرکات انبار</h2>
              </div>
              <SegmentedControl
                ariaLabel="فیلتر حرکت انبار"
                block
                className="mb-4"
                items={[
                  { id: "all", label: "همه" },
                  { id: "ENTRY", label: "ورود" },
                  { id: "EXIT", label: "خروج" },
                ]}
                active={movementTab}
                onChange={(v) => setMovementTab(v as MovementTab)}
              />
              {itemMovements.length === 0 ? (
                <div className="card" style={{ paddingInline: 0, paddingBlock: "var(--space-2)" }}>
                  <EmptyState
                    icon={<Warehouse size={30} aria-hidden />}
                    title="هنوز حرکتی برای این کالا ثبت نشده است."
                    description="با ثبت ورود یا خروج، تاریخچهٔ انبار این کالا ساخته می‌شود."
                    actions={
                      <Button
                        icon={<ArrowDownToLine size={18} aria-hidden />}
                        onClick={() => setMovement({ open: true, kind: "ENTRY" })}
                      >
                        ورود کالا
                      </Button>
                    }
                  />
                </div>
              ) : visibleMovements.length === 0 ? (
                <div className="card" style={{ paddingInline: 0, paddingBlock: "var(--space-2)" }}>
                  <EmptyState
                    compact
                    icon={<Search size={26} aria-hidden />}
                    title="حرکتی با این فیلتر پیدا نشد"
                    actions={
                      <Button variant="secondary" size="sm" onClick={() => setMovementTab("all")}>
                        نمایش همه
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="timeline">
                  {visibleMovements.map((m) => (
                    <MovementRow key={m.id} movement={m} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* برگهٔ ورود/خروج */}
      {isProduct && (
        <StockMovementSheet
          open={movement.open}
          kind={movement.kind}
          productName={item.name}
          unit={item.unit}
          currentStock={item.currentStock ?? 0}
          onClose={() => setMovement((m) => ({ ...m, open: false }))}
          onSubmit={(values) => {
            store.applyMovement({
              productId: item.id,
              type: movement.kind,
              quantity: values.quantity,
              date: values.date,
              description: values.description,
              source: "MANUAL",
            });
          }}
        />
      )}

      {/* منوی بیشتر */}
      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title={item.name}>
        <div className="list">
          <ListItem
            icon={<Pencil size={20} aria-hidden />}
            title="ویرایش اطلاعات"
            onClick={() => {
              setMenuOpen(false);
              navigate(`/products/add?id=${item.id}`);
            }}
          />
          <ListItem
            icon={<Trash2 size={20} aria-hidden />}
            title={`حذف ${TYPE_LABEL[item.type]}`}
            className="danger-row"
            onClick={() => {
              setMenuOpen(false);
              setDeleteOpen(true);
            }}
          />
        </div>
      </BottomSheet>

      {/* تأیید حذف */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={hasInvoiceHistory ? `حذف ${TYPE_LABEL[item.type]} مجاز نیست` : `حذف ${TYPE_LABEL[item.type]}؟`}
        description={
          hasInvoiceHistory
            ? "این قلم در فاکتورهای ثبت‌شده استفاده شده و برای حفظ تاریخچهٔ فاکتورها حذف نمی‌شود."
            : `«${item.name}» به‌طور کامل حذف می‌شود. این عمل قابل بازگشت نیست.`
        }
        footer={
          hasInvoiceHistory ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setDeleteOpen(false);
                  navigate(`/invoices/invoice/${referencedInvoices[0].id}`);
                }}
              >
                مشاهدهٔ فاکتورها
              </Button>
              <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
                بستن
              </Button>
            </>
          ) : (
            <>
              <Button variant="destructive" onClick={doDelete}>
                حذف {TYPE_LABEL[item.type]}
              </Button>
              <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
                انصراف
              </Button>
            </>
          )
        }
      >
        {hasInvoiceHistory ? (
          <Alert
            variant="warning"
            title="قلم دارای سابقهٔ فاکتور حذف نمی‌شود"
            description={`${faNum(referencedInvoices.length)} فاکتور به این قلم ارجاع دارد. فاکتورها نام و قیمت را در لحظهٔ ثبت ذخیره می‌کنند؛ برای پنهان‌کردن این قلم از فهرست، می‌توانید آن را ویرایش و «نمایش در لیست قیمت» را غیرفعال کنید.`}
          />
        ) : (
          isProduct &&
          (itemMovements.length > 0 || (item.currentStock ?? 0) > 0) && (
            <Alert
              variant="warning"
              title="این کالا تاریخچهٔ انبار دارد"
              description={`${faNum(itemMovements.length)} حرکت ورود/خروج به همراه موجودی فعلی حذف می‌شود. در فازهای آینده برای حفظ سوابق، بایگانی جداگانه در نظر گرفته خواهد شد.`}
            />
          )
        )}
      </Modal>
    </>
  );
}

/* ------------------------------ زیرکامپوننت‌ها ------------------------------ */

function SpecRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="spec-list__row">
      <span className="spec-list__label">{label}</span>
      <span className="spec-list__value">{children}</span>
    </div>
  );
}

function MovementRow({ movement }: { movement: StockMovement }) {
  const isEntry = movement.type === "ENTRY";
  return (
    <div className="t-item">
      <span className={cn("t-item__icon", isEntry ? "t-item__icon--entry" : "t-item__icon--exit")} aria-hidden>
        {isEntry ? <ArrowDownToLine size={18} /> : <ArrowUpFromLine size={18} />}
      </span>
      <div className="t-item__body">
        <span className="t-item__title">
          {isEntry ? "ورود کالا" : "خروج کالا"}
          {movement.source === "INITIAL" && " · موجودی اولیه"}
          {movement.source === "INVOICE" && " · با فاکتور"}
        </span>
        {movement.description && (
          <span className="t-item__desc">{movement.description}</span>
        )}
        <span className="t-item__date">
          {relativeFaDate(movement.date)} · {faDateLong(movement.date)}
        </span>
      </div>
      <div className="t-item__amount">
        <span className={cn("t-item__value", isEntry ? "t-item__value--received" : "t-item__value--paid")}>
          {isEntry ? "+" : "−"} {faNum(movement.quantity)}
        </span>
        <span className="t-item__unit">{movement.unit ?? ""}</span>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div role="status" aria-label="در حال بارگذاری جزئیات">
      <div className="party-profile" aria-hidden>
        <Skeleton width={72} height={72} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          <Skeleton width="45%" height={16} />
          <Skeleton width="65%" height={12} />
        </div>
      </div>
      <Skeleton width={110} height={16} className="mt-6" />
      <Skeleton height={180} width="100%" className="mt-2" />
      <div className="stack mt-6" aria-hidden>
        <Skeleton height={52} width="100%" />
        <Skeleton height={52} width="100%" />
      </div>
    </div>
  );
}
