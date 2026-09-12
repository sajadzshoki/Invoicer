import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Barcode, Globe, Package, ScanLine, Tags, UserPlus, Wrench } from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  AmountInput,
  Field,
  Input,
  Select,
  Textarea,
  useFieldId,
} from "@/components/ui/Field";
import { Switch } from "@/components/ui/Choice";
import { ErrorState } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { useInventoryStore } from "@/inventory/store";
import { useSettings } from "@/settings/store";
import type { ItemType } from "@/inventory/types";
import { ImagePicker } from "@/components/product/ImagePicker";
import { CategoriesSheet } from "@/components/product/CategoriesSheet";
import { BarcodeSheet } from "@/components/product/BarcodeSheet";
import {
  faNum,
  formatAmountInput,
  parseAmountDigits,
} from "@/lib/fa";
import { cn } from "@/lib/cn";

const UNIT_SUGGESTIONS = [
  "عدد",
  "کیلوگرم",
  "گرم",
  "لیتر",
  "بسته",
  "کارتن",
  "بطری",
  "کیسه",
  "جفت",
  "ساعت",
];

interface FormErrors {
  name?: string;
  unit?: string;
  barcode?: string;
  initialStock?: string;
  purchasePrice?: string;
  salePrice?: string;
  reorderPoint?: string;
  minOrderQty?: string;
  servicePrice?: string;
}

/**
 * فرم ساخت/ویرایش کالا و خدمت
 * مسیر ساخت: /products/add (با ?type=PRODUCT|SERVICE)
 * مسیر ویرایش: /products/add?id=:id
 */
export function ProductFormPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const store = useInventoryStore();
  const { settings } = useSettings();
  const { products, categories, addProduct, updateProduct, isBarcodeTaken } = store;

  const editId = searchParams.get("id") ?? undefined;
  const editingItem = useMemo(
    () => (editId ? products.find((p) => p.id === editId) : undefined),
    [editId, products]
  );
  const isEdit = !!editId;
  const notFound = isEdit && !editingItem;

  const initialType: ItemType = isEdit
    ? editingItem?.type ?? "PRODUCT"
    : searchParams.get("type") === "SERVICE"
      ? "SERVICE"
      : searchParams.get("type") === "PRODUCT"
        ? "PRODUCT"
        : "PRODUCT";

  const [type, setType] = useState<ItemType>(initialType);
  const [image, setImage] = useState<string | undefined>(editingItem?.image);
  const [name, setName] = useState(editingItem?.name ?? "");
  const [description, setDescription] = useState(editingItem?.description ?? "");
  const [categoryId, setCategoryId] = useState(editingItem?.categoryId ?? "");
  const [showOnline, setShowOnline] = useState(
    editingItem?.showInOnlinePriceList ?? false
  );

  // فیلدهای کالا — برای کالای «جدید» پیش‌فرض‌ها از تنظیمات می‌آیند (فاز ۷)؛
  // کالای موجود هنگام ویرایش با مقدارهای خودش باز می‌شود.
  const [barcode, setBarcode] = useState(editingItem?.barcode ?? "");
  const [unit, setUnit] = useState(
    editingItem?.unit ?? settings.inventory.defaultUnit
  );
  const [initialStock, setInitialStock] = useState(
    isEdit ? faNum(editingItem?.currentStock ?? 0) : ""
  );
  const [purchasePrice, setPurchasePrice] = useState(
    editingItem?.purchasePrice ? faNum(editingItem.purchasePrice) : ""
  );
  const [salePrice, setSalePrice] = useState(
    editingItem?.salePrice ? faNum(editingItem.salePrice) : ""
  );
  const [reorderPoint, setReorderPoint] = useState(
    editingItem?.reorderPoint !== undefined
      ? faNum(editingItem.reorderPoint)
      : settings.inventory.defaultReorderPoint !== undefined
        ? faNum(settings.inventory.defaultReorderPoint)
        : ""
  );
  const [minOrderQty, setMinOrderQty] = useState(
    editingItem?.minimumOrderQuantity !== undefined
      ? faNum(editingItem.minimumOrderQuantity)
      : ""
  );

  // فیلد خدمت
  const [servicePrice, setServicePrice] = useState(
    editingItem?.servicePrice ? faNum(editingItem.servicePrice) : ""
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [barcodeSheetOpen, setBarcodeSheetOpen] = useState(false);

  const nameId = useFieldId();
  const descId = useFieldId();
  const barcodeId = useFieldId();
  const unitId = useFieldId();
  const stockId = useFieldId();
  const catId = useFieldId();

  // حذف پارامتر نوع از آدرس پس از خواندن
  useEffect(() => {
    if (!isEdit && searchParams.get("type")) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, isEdit]);

  if (notFound) {
    return (
      <>
        <PageHeader title="ویرایش" onBack />
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

  const isProduct = type === "PRODUCT";

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    const trimmedName = name.trim();
    if (!trimmedName) next.name = "نام را وارد کنید.";
    else if (trimmedName.length < 2) next.name = "نام باید حداقل ۲ حرف باشد.";

    if (isProduct) {
      if (!unit.trim()) next.unit = "واحد را وارد کنید؛ مثل عدد یا کیلوگرم.";
      if (barcode.trim() && isBarcodeTaken(barcode.trim(), editId)) {
        next.barcode = "این بارکد برای کالای دیگری ثبت شده است.";
      }
      const purchase = Number(parseAmountDigits(purchasePrice));
      if (!purchasePrice || purchase <= 0) {
        next.purchasePrice = "قیمت خرید را وارد کنید.";
      }
      const sale = Number(parseAmountDigits(salePrice));
      if (!salePrice || sale <= 0) {
        next.salePrice = "قیمت فروش را وارد کنید.";
      }
      if (reorderPoint) {
        const rp = Number(parseAmountDigits(reorderPoint));
        if (rp < 0) next.reorderPoint = "نقطهٔ سفارش نمی‌تواند منفی باشد.";
      }
      if (showOnline && minOrderQty) {
        const mq = Number(parseAmountDigits(minOrderQty));
        if (mq < 1) next.minOrderQty = "حداقل سفارش باید حداقل ۱ باشد.";
      }
    } else {
      const price = Number(parseAmountDigits(servicePrice));
      if (!servicePrice || price <= 0) {
        next.servicePrice = "فی خدمت را وارد کنید.";
      }
    }
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
      type,
      name,
      description: description.trim() || undefined,
      image,
      categoryId: categoryId || undefined,
      showInOnlinePriceList: showOnline,
      barcode: isProduct ? barcode.trim() || undefined : undefined,
      unit: isProduct ? unit.trim() : undefined,
      initialStock: isProduct && !isEdit
        ? Number(parseAmountDigits(initialStock) || "0")
        : undefined,
      purchasePrice: isProduct ? Number(parseAmountDigits(purchasePrice)) : undefined,
      salePrice: isProduct ? Number(parseAmountDigits(salePrice)) : undefined,
      servicePrice: !isProduct ? Number(parseAmountDigits(servicePrice)) : undefined,
      reorderPoint:
        isProduct && reorderPoint
          ? Number(parseAmountDigits(reorderPoint))
          : undefined,
      minimumOrderQuantity:
        isProduct && showOnline && minOrderQty
          ? Number(parseAmountDigits(minOrderQty))
          : undefined,
    };

    window.setTimeout(() => {
      if (isEdit && editingItem) {
        updateProduct(editingItem.id, input);
        showToast({
          variant: "success",
          title: "تغییرات ذخیره شد",
          description: `«${name.trim()}» به‌روزرسانی شد.`,
        });
        navigate(`/products/${editingItem.id}`);
      } else {
        const created = addProduct(input);
        const initial = input.initialStock ?? 0;
        showToast({
          variant: "success",
          title: isProduct ? "کالا ساخته شد" : "خدمت ساخته شد",
          description:
            isProduct && initial > 0
              ? `«${name.trim()}» با موجودی اولیهٔ ${faNum(initial)} ثبت شد.`
              : `«${name.trim()}» به فهرست اضافه شد.`,
        });
        navigate(`/products/${created.id}`);
      }
    }, 600);
  };

  const cancel = () => {
    if (isEdit && editingItem) navigate(`/products/${editingItem.id}`);
    else navigate("/products");
  };

  const clearError = (key: keyof FormErrors) =>
    setErrors((er) => (er[key] ? { ...er, [key]: undefined } : er));

  return (
    <>
      <PageHeader
        title={isEdit ? `ویرایش ${isProduct ? "کالا" : "خدمت"}` : "افزودن"}
        subtitle={isEdit ? editingItem?.name : isProduct ? "ساخت کالای جدید" : "تعریف خدمت جدید"}
        onBack
      />

      <div className="page form-page">
        {/* انتخاب نوع — در ویرایش ثابت است */}
        {!isEdit && (
          <div className="type-switch" role="radiogroup" aria-label="نوع قلم">
            <button
              type="button"
              role="radio"
              aria-checked={type === "PRODUCT"}
              className={cn("type-switch__option", type === "PRODUCT" && "is-active")}
              onClick={() => setType("PRODUCT")}
            >
              <Package size={20} aria-hidden />
              کالا
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={type === "SERVICE"}
              className={cn("type-switch__option", type === "SERVICE" && "is-active")}
              onClick={() => setType("SERVICE")}
            >
              <Wrench size={20} aria-hidden />
              خدمت
            </button>
          </div>
        )}

        {type === "SERVICE" && (
          <div className="service-callout" role="note">
            <Wrench size={16} aria-hidden />
            این فرم برای «خدمت» است؛ موجودی، واحد و بارکد فقط برای کالا کاربرد دارند.
          </div>
        )}

        <div className="card form-card">
          <div className="stack" style={{ gap: "var(--space-5)" }}>
            <Field label="تصویر" optional>
              <ImagePicker value={image} onChange={setImage} />
            </Field>

            <Field
              label={isProduct ? "نام کالا" : "نام خدمت"}
              htmlFor={nameId}
              error={errors.name}
            >
              <Input
                id={nameId}
                value={name}
                invalid={!!errors.name}
                placeholder={isProduct ? "مثلاً روغن آفتاب‌گردان یک لیتری" : "مثلاً نصب ویندوز"}
                onChange={(e) => {
                  setName(e.target.value);
                  clearError("name");
                }}
              />
            </Field>

            <Field label="توضیحات" htmlFor={descId} optional>
              <Textarea
                id={descId}
                rows={2}
                value={description}
                placeholder="توضیح کوتاه برای معرفی قلم"
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            <div className="grid-2">
              <Field
                label="دسته‌بندی"
                htmlFor={catId}
                optional
              >
                <Select
                  id={catId}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">بدون دسته</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
                <Button
                  variant="text"
                  size="sm"
                  icon={<Tags size={14} aria-hidden />}
                  onClick={() => setCategoriesOpen(true)}
                  style={{ alignSelf: "flex-start" }}
                >
                  مدیریت دسته‌ها
                </Button>
              </Field>

              {isProduct && (
                <Field
                  label="بارکد"
                  htmlFor={barcodeId}
                  optional
                  error={errors.barcode}
                >
                  <div className="barcode-row">
                    <Input
                      id={barcodeId}
                      value={barcode}
                      invalid={!!errors.barcode}
                      placeholder="۶۲۱۰۰۰۱۱۱۲۲۲۳"
                      inputMode="numeric"
                      dir="ltr"
                      style={{ textAlign: "end" }}
                      leading={<Barcode size={20} aria-hidden />}
                      onChange={(e) => {
                        setBarcode(e.target.value);
                        clearError("barcode");
                      }}
                    />
                    <Button
                      variant="secondary"
                      icon={<ScanLine size={18} aria-hidden />}
                      onClick={() => setBarcodeSheetOpen(true)}
                    >
                      اسکن
                    </Button>
                  </div>
                </Field>
              )}
            </div>

            {/* ---------- فیلدهای اختصاصی کالا ---------- */}
            {isProduct && (
              <>
                <Field
                  label="واحد"
                  htmlFor={unitId}
                  error={errors.unit}
                  hint={!errors.unit ? "واحد شمارش کالا؛ مثل عدد، کیلوگرم یا کارتن" : undefined}
                >
                  <Input
                    id={unitId}
                    value={unit}
                    invalid={!!errors.unit}
                    placeholder="مثلاً عدد"
                    onChange={(e) => {
                      setUnit(e.target.value);
                      clearError("unit");
                    }}
                  />
                  <div className="chip-row mt-2">
                    {UNIT_SUGGESTIONS.map((u) => (
                      <button
                        key={u}
                        type="button"
                        className={cn("chip chip--sm", unit === u && "is-active")}
                        onClick={() => {
                          setUnit(u);
                          clearError("unit");
                        }}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </Field>

                {!isEdit && (
                  <Field
                    label="موجودی اولیه"
                    htmlFor={stockId}
                    optional
                    error={errors.initialStock}
                    hint={!errors.initialStock ? "صفر هم مجاز است؛ بعداً با ورود/خروج تغییر می‌کند." : undefined}
                  >
                    <Input
                      id={stockId}
                      value={initialStock}
                      invalid={!!errors.initialStock}
                      inputMode="numeric"
                      placeholder="۰"
                      onChange={(e) => {
                        setInitialStock(formatAmountInput(e.target.value));
                        clearError("initialStock");
                      }}
                    />
                  </Field>
                )}

                <div className="grid-2">
                  <Field
                    label="قیمت خرید"
                    htmlFor="purchase-price"
                    error={errors.purchasePrice}
                  >
                    <AmountInput
                      id="purchase-price"
                      value={purchasePrice}
                      invalid={!!errors.purchasePrice}
                      onValueChange={(v) => {
                        setPurchasePrice(v);
                        clearError("purchasePrice");
                      }}
                    />
                  </Field>
                  <Field label="قیمت فروش" htmlFor="sale-price" error={errors.salePrice}>
                    <AmountInput
                      id="sale-price"
                      value={salePrice}
                      invalid={!!errors.salePrice}
                      onValueChange={(v) => {
                        setSalePrice(v);
                        clearError("salePrice");
                      }}
                    />
                  </Field>
                </div>

                <div className="grid-2">
                  <Field
                    label="نقطهٔ سفارش"
                    optional
                    error={errors.reorderPoint}
                    hint={!errors.reorderPoint ? "اگر موجودی به این عدد برسد هشدار می‌گیرید." : undefined}
                  >
                    <Input
                      value={reorderPoint}
                      invalid={!!errors.reorderPoint}
                      inputMode="numeric"
                      placeholder="مثلاً ۵"
                      onChange={(e) => {
                        setReorderPoint(formatAmountInput(e.target.value));
                        clearError("reorderPoint");
                      }}
                    />
                  </Field>
                  {showOnline && (
                    <Field
                      label="حداقل تعداد سفارش"
                      optional
                      error={errors.minOrderQty}
                      hint={!errors.minOrderQty ? "برای لیست قیمت آنلاین" : undefined}
                    >
                      <Input
                        value={minOrderQty}
                        invalid={!!errors.minOrderQty}
                        inputMode="numeric"
                        placeholder="۱"
                        onChange={(e) => {
                          setMinOrderQty(formatAmountInput(e.target.value));
                          clearError("minOrderQty");
                        }}
                      />
                    </Field>
                  )}
                </div>
              </>
            )}

            {/* ---------- فیلد اختصاصی خدمت ---------- */}
            {!isProduct && (
              <Field label="فی (قیمت خدمت)" htmlFor="service-price" error={errors.servicePrice}>
                <AmountInput
                  id="service-price"
                  value={servicePrice}
                  invalid={!!errors.servicePrice}
                  onValueChange={(v) => {
                    setServicePrice(v);
                    clearError("servicePrice");
                  }}
                />
              </Field>
            )}

            <div className="online-row">
              <Switch
                label={
                  <span>
                    نمایش در لیست قیمت آنلاین
                    <span className="check__desc">
                      {isProduct
                        ? "قیمت فروش، دسته و حداقل سفارش در لیست نمایش داده می‌شود."
                        : "فی و دستهٔ خدمت در لیست نمایش داده می‌شود."}
                    </span>
                  </span>
                }
                checked={showOnline}
                onChange={(e) => setShowOnline(e.target.checked)}
              />
              {showOnline && (
                <span className="online-row__status">
                  <Globe size={15} aria-hidden />
                  فعال
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* نوار اقدام چسبان */}
      <div className="sticky-footer">
        <div className="sticky-footer__inner">
          <Button block size="lg" loading={submitting} icon={<UserPlus size={20} aria-hidden />} onClick={submit}>
            {isEdit ? "ذخیرهٔ تغییرات" : isProduct ? "افزودن کالا" : "افزودن خدمت"}
          </Button>
          <Button block variant="ghost" onClick={cancel} disabled={submitting}>
            بازگشت
          </Button>
        </div>
      </div>

      <CategoriesSheet
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        onPicked={(id) => setCategoryId(id)}
      />

      <BarcodeSheet
        open={barcodeSheetOpen}
        onClose={() => setBarcodeSheetOpen(false)}
        onScan={(code) => {
          setBarcode(code);
          clearError("barcode");
        }}
      />
    </>
  );
}
