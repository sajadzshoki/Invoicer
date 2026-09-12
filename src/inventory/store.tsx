import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ItemType,
  Product,
  ProductCategory,
  StockMovement,
} from "./types";
import { SEED_CATEGORIES, SEED_MOVEMENTS, SEED_PRODUCTS } from "./seed";

/**
 * مخزن دادهٔ محلی ماژول کالاها و خدمات
 *
 * نکتهٔ حسابداری: تنها متدی که موجودی را تغییر می‌دهد `applyMovement`
 * است و هیچ اتصال به استور طرف حساب‌ها (book) ندارد؛ تفکیک ماژول‌ها
 * عمداً حفظ شده است.
 */

const STORAGE_KEY = "nasagh:inventory:v1";

interface InventoryData {
  products: Product[];
  categories: ProductCategory[];
  movements: StockMovement[];
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadInitial(): InventoryData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as InventoryData;
      // دادهٔ معتبر هرگز دور ریخته نمی‌شود؛ دسته‌های گم‌شده خالی فرض می‌شوند.
      if (Array.isArray(parsed.products) && Array.isArray(parsed.movements)) {
        return {
          products: parsed.products,
          movements: parsed.movements,
          categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        };
      }
    }
  } catch {
    /* دادهٔ خراب → شروع با دادهٔ نمونه */
  }
  return {
    products: SEED_PRODUCTS,
    categories: SEED_CATEGORIES,
    movements: SEED_MOVEMENTS,
  };
}

export interface AddProductInput {
  type: ItemType;
  name: string;
  description?: string;
  image?: string;
  categoryId?: string;
  showInOnlinePriceList: boolean;
  barcode?: string;
  unit?: string;
  initialStock?: number;
  purchasePrice?: number;
  salePrice?: number;
  servicePrice?: number;
  reorderPoint?: number;
  minimumOrderQuantity?: number;
}

export interface MovementInput {
  productId: string;
  type: "ENTRY" | "EXIT";
  quantity: number;
  date: string;
  description?: string;
  source?: StockMovement["source"];
  /** برای حرکات متصل به فاکتور (فاز ۴) */
  invoiceId?: string;
}

interface InventoryStoreValue extends InventoryData {
  addProduct: (input: AddProductInput) => Product;
  updateProduct: (id: string, input: AddProductInput) => Product | null;
  deleteProduct: (id: string) => void;
  /** ثبت حرکت انبار و به‌روزرسانی موجودی — فقط موجودی، بدون اثر مالی */
  applyMovement: (input: MovementInput) => StockMovement | null;
  /**
   * حذف همهٔ حرکات متصل به یک فاکتور و بازگشت اثر آن‌ها بر موجودی
   * (برای ویرایش/حذف فاکتور — جلوگیری از اثر مضاعف).
   */
  removeMovementsForInvoice: (invoiceId: string) => void;
  /** مجموع مقداری که یک فاکتور از کالایی خارج کرده — برای محاسبهٔ موجودی در دسترس هنگام ویرایش فاکتور فروش */
  soldByInvoice: (invoiceId: string, productId: string) => number;
  addCategory: (name: string) => { ok: boolean; error?: string };
  renameCategory: (id: string, name: string) => { ok: boolean; error?: string };
  /** حذف دسته فقط اگر هیچ قلمی از آن استفاده نکند */
  deleteCategory: (id: string) => { ok: boolean; error?: string; usedBy?: number };
  categoryUsage: (categoryId: string) => number;
  isBarcodeTaken: (barcode: string, exceptProductId?: string) => boolean;
  resetToSample: () => void;
}

const InventoryContext = createContext<InventoryStoreValue | null>(null);

function buildProduct(id: string, input: AddProductInput, prev?: Product): Product {
  const now = new Date().toISOString();
  const base: Product = {
    id,
    type: input.type,
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    image: input.image || undefined,
    categoryId: input.categoryId || undefined,
    showInOnlinePriceList: input.showInOnlinePriceList,
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
  };

  if (input.type === "PRODUCT") {
    return {
      ...base,
      barcode: input.barcode?.trim() || undefined,
      unit: input.unit?.trim() || undefined,
      initialStock: prev?.initialStock ?? input.initialStock ?? 0,
      currentStock: prev?.currentStock ?? input.initialStock ?? 0,
      purchasePrice: input.purchasePrice,
      salePrice: input.salePrice,
      reorderPoint: input.reorderPoint,
      minimumOrderQuantity: input.showInOnlinePriceList
        ? input.minimumOrderQuantity
        : undefined,
    };
  }
  // خدمت — فیلدهای کالا عمداً بدون مقدار می‌مانند
  return {
    ...base,
    servicePrice: input.servicePrice,
  };
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<InventoryData>(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* پر بودن حافظهٔ محلی مانع کار با اپ نمی‌شود */
    }
  }, [data]);

  const addProduct = useCallback((input: AddProductInput): Product => {
    const product = buildProduct(makeId(input.type === "PRODUCT" ? "p" : "s"), input);
    setData((d) => {
      let movements = d.movements;
      // موجودی اولیهٔ بزرگ‌تر از صفر → ثبت ورود انبار (جدا از فاکتور)
      if (
        product.type === "PRODUCT" &&
        (product.initialStock ?? 0) > 0
      ) {
        movements = [
          {
            id: makeId("m"),
            productId: product.id,
            type: "ENTRY",
            quantity: product.initialStock ?? 0,
            unit: product.unit,
            date: new Date().toISOString().slice(0, 10),
            description: "موجودی اولیه هنگام ساخت کالا",
            source: "INITIAL",
            createdAt: new Date().toISOString(),
          },
          ...d.movements,
        ];
      }
      return { ...d, products: [product, ...d.products], movements };
    });
    return product;
  }, []);

  const updateProduct = useCallback(
    (id: string, input: AddProductInput): Product | null => {
      let updated: Product | null = null;
      setData((d) => ({
        ...d,
        products: d.products.map((p) => {
          if (p.id !== id) return p;
          updated = buildProduct(id, input, p);
          return updated;
        }),
      }));
      return updated;
    },
    []
  );

  const deleteProduct = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      products: d.products.filter((p) => p.id !== id),
      movements: d.movements.filter((m) => m.productId !== id),
    }));
  }, []);

  const applyMovement = useCallback(
    (input: MovementInput): StockMovement | null => {
      let created: StockMovement | null = null;
      setData((d) => {
        const product = d.products.find((p) => p.id === input.productId);
        if (!product || product.type !== "PRODUCT") return d;

        created = {
          id: makeId("m"),
          productId: input.productId,
          type: input.type,
          quantity: input.quantity,
          unit: product.unit,
          date: input.date,
          description: input.description?.trim() || undefined,
          source: input.source ?? "MANUAL",
          invoiceId: input.invoiceId,
          createdAt: new Date().toISOString(),
        };
        const delta = input.type === "ENTRY" ? input.quantity : -input.quantity;
        return {
          ...d,
          movements: [created, ...d.movements],
          products: d.products.map((p) =>
            p.id === input.productId
              ? {
                  ...p,
                  currentStock: Math.max(0, (p.currentStock ?? 0) + delta),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        };
      });
      return created;
    },
    []
  );

  const removeMovementsForInvoice = useCallback((invoiceId: string) => {
    setData((d) => {
      const linked = d.movements.filter((m) => m.invoiceId === invoiceId);
      if (linked.length === 0) return d;
      // بازگشت اثر هر حرکت بر موجودی
      const deltaByProduct = new Map<string, number>();
      for (const m of linked) {
        const delta = m.type === "ENTRY" ? -m.quantity : m.quantity;
        deltaByProduct.set(
          m.productId,
          (deltaByProduct.get(m.productId) ?? 0) + delta
        );
      }
      return {
        ...d,
        movements: d.movements.filter((m) => m.invoiceId !== invoiceId),
        products: d.products.map((p) =>
          deltaByProduct.has(p.id)
            ? {
                ...p,
                currentStock: Math.max(
                  0,
                  (p.currentStock ?? 0) + (deltaByProduct.get(p.id) ?? 0)
                ),
                updatedAt: new Date().toISOString(),
              }
            : p
        ),
      };
    });
  }, []);

  const soldByInvoice = useCallback(
    (invoiceId: string, productId: string): number =>
      data.movements
        .filter(
          (m) =>
            m.invoiceId === invoiceId &&
            m.productId === productId &&
            m.type === "EXIT"
        )
        .reduce((sum, m) => sum + m.quantity, 0),
    [data.movements]
  );

  const addCategory = useCallback(
    (name: string): { ok: boolean; error?: string } => {
      const trimmed = name.trim();
      if (!trimmed) return { ok: false, error: "نام دسته را بنویسید." };
      let result: { ok: boolean; error?: string } = { ok: true };
      setData((d) => {
        if (d.categories.some((c) => c.name === trimmed)) {
          result = { ok: false, error: "دسته‌ای با این نام وجود دارد." };
          return d;
        }
        const now = new Date().toISOString();
        return {
          ...d,
          categories: [
            ...d.categories,
            { id: makeId("cat"), name: trimmed, createdAt: now, updatedAt: now },
          ],
        };
      });
      return result;
    },
    []
  );

  const renameCategory = useCallback(
    (id: string, name: string): { ok: boolean; error?: string } => {
      const trimmed = name.trim();
      if (!trimmed) return { ok: false, error: "نام دسته را بنویسید." };
      let result: { ok: boolean; error?: string } = { ok: true };
      setData((d) => {
        if (d.categories.some((c) => c.id !== id && c.name === trimmed)) {
          result = { ok: false, error: "دسته‌ای با این نام وجود دارد." };
          return d;
        }
        return {
          ...d,
          categories: d.categories.map((c) =>
            c.id === id
              ? { ...c, name: trimmed, updatedAt: new Date().toISOString() }
              : c
          ),
        };
      });
      return result;
    },
    []
  );

  const deleteCategory = useCallback(
    (id: string): { ok: boolean; error?: string; usedBy?: number } => {
      let result: { ok: boolean; error?: string; usedBy?: number } = { ok: true };
      setData((d) => {
        const usedBy = d.products.filter((p) => p.categoryId === id).length;
        if (usedBy > 0) {
          result = {
            ok: false,
            usedBy,
            error: "این دسته در حال استفاده است و حذف نمی‌شود.",
          };
          return d;
        }
        return { ...d, categories: d.categories.filter((c) => c.id !== id) };
      });
      return result;
    },
    []
  );

  const categoryUsage = useCallback(
    (categoryId: string): number =>
      data.products.filter((p) => p.categoryId === categoryId).length,
    [data.products]
  );

  const isBarcodeTaken = useCallback(
    (barcode: string, exceptProductId?: string): boolean => {
      const code = barcode.trim();
      if (!code) return false;
      return data.products.some(
        (p) => p.barcode === code && p.id !== exceptProductId
      );
    },
    [data.products]
  );

  const resetToSample = useCallback(() => {
    setData({
      products: SEED_PRODUCTS,
      categories: SEED_CATEGORIES,
      movements: SEED_MOVEMENTS,
    });
  }, []);

  const value = useMemo<InventoryStoreValue>(
    () => ({
      ...data,
      addProduct,
      updateProduct,
      deleteProduct,
      applyMovement,
      removeMovementsForInvoice,
      soldByInvoice,
      addCategory,
      renameCategory,
      deleteCategory,
      categoryUsage,
      isBarcodeTaken,
      resetToSample,
    }),
    [
      data,
      addProduct,
      updateProduct,
      deleteProduct,
      applyMovement,
      removeMovementsForInvoice,
      soldByInvoice,
      addCategory,
      renameCategory,
      deleteCategory,
      categoryUsage,
      isBarcodeTaken,
      resetToSample,
    ]
  );

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventoryStore(): InventoryStoreValue {
  const ctx = useContext(InventoryContext);
  if (!ctx) {
    throw new Error("useInventoryStore باید داخل InventoryProvider استفاده شود");
  }
  return ctx;
}
