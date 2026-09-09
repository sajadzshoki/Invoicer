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
  CostAttachment,
  CostCategory,
  RegisterCost,
  RegisterCostType,
} from "./types";
import { SEED_COST_CATEGORIES, SEED_COSTS } from "./seed";

/**
 * مخزن دادهٔ محلی ماژول هزینه‌ها و درآمدها (فاز ۵)
 *
 * این ماژول کاملاً مستقل است: هیچ اتصال به طرف حساب‌ها، فاکتورها یا
 * چک‌ها ندارد و هیچ اثری بر ماندهٔ اشخاص نمی‌گذارد.
 */

const STORAGE_KEY = "nasagh:costs:v1";

interface CostData {
  costs: RegisterCost[];
  categories: CostCategory[];
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadInitial(): CostData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CostData;
      if (Array.isArray(parsed.costs) && Array.isArray(parsed.categories)) {
        return parsed;
      }
    }
  } catch {
    /* دادهٔ خراب → شروع با دادهٔ نمونه */
  }
  return { costs: SEED_COSTS, categories: SEED_COST_CATEGORIES };
}

export interface CostInput {
  type: RegisterCostType;
  title: string;
  categoryId: string;
  amount: number;
  date: string;
  time: string;
  description?: string;
  attachment?: CostAttachment;
}

interface CostStoreValue extends CostData {
  getCost: (id: string) => RegisterCost | undefined;
  getCategory: (id: string) => CostCategory | undefined;
  addCost: (input: CostInput) => RegisterCost;
  updateCost: (id: string, input: CostInput) => RegisterCost | null;
  deleteCost: (id: string) => void;
  addCategory: (kind: RegisterCostType, name: string) => { ok: boolean; error?: string };
  renameCategory: (id: string, name: string) => { ok: boolean; error?: string };
  /** حذف دسته فقط اگر هیچ رکوردی از آن استفاده نکند */
  deleteCategory: (id: string) => { ok: boolean; error?: string; usedBy?: number };
  categoryUsage: (categoryId: string) => number;
  resetToSample: () => void;
}

const CostContext = createContext<CostStoreValue | null>(null);

export function CostProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CostData>(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* پر بودن حافظهٔ محلی مانع کار با اپ نمی‌شود */
    }
  }, [data]);

  const addCost = useCallback((input: CostInput): RegisterCost => {
    const now = new Date().toISOString();
    const cost: RegisterCost = {
      id: makeId("rc"),
      type: input.type,
      title: input.title.trim(),
      categoryId: input.categoryId,
      amount: input.amount,
      date: input.date,
      time: input.time,
      description: input.description?.trim() || undefined,
      attachment: input.attachment,
      createdAt: now,
      updatedAt: now,
    };
    setData((d) => ({ ...d, costs: [cost, ...d.costs] }));
    return cost;
  }, []);

  const updateCost = useCallback(
    (id: string, input: CostInput): RegisterCost | null => {
      let updated: RegisterCost | null = null;
      setData((d) => ({
        ...d,
        costs: d.costs.map((c) => {
          if (c.id !== id) return c;
          updated = {
            ...c,
            type: input.type,
            title: input.title.trim(),
            categoryId: input.categoryId,
            amount: input.amount,
            date: input.date,
            time: input.time,
            description: input.description?.trim() || undefined,
            attachment: input.attachment,
            updatedAt: new Date().toISOString(),
          };
          return updated;
        }),
      }));
      return updated;
    },
    []
  );

  const deleteCost = useCallback((id: string) => {
    setData((d) => ({ ...d, costs: d.costs.filter((c) => c.id !== id) }));
  }, []);

  const addCategory = useCallback(
    (kind: RegisterCostType, name: string): { ok: boolean; error?: string } => {
      const trimmed = name.trim();
      if (!trimmed) return { ok: false, error: "نام دسته را بنویسید." };
      let result: { ok: boolean; error?: string } = { ok: true };
      setData((d) => {
        if (d.categories.some((c) => c.kind === kind && c.name === trimmed)) {
          result = { ok: false, error: "دسته‌ای با این نام وجود دارد." };
          return d;
        }
        const now = new Date().toISOString();
        return {
          ...d,
          categories: [
            ...d.categories,
            { id: makeId("cat"), name: trimmed, kind, createdAt: now, updatedAt: now },
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
        const target = d.categories.find((c) => c.id === id);
        if (!target) return d;
        if (
          d.categories.some(
            (c) => c.id !== id && c.kind === target.kind && c.name === trimmed
          )
        ) {
          result = { ok: false, error: "دسته‌ای با این نام وجود دارد." };
          return d;
        }
        return {
          ...d,
          categories: d.categories.map((c) =>
            c.id === id ? { ...c, name: trimmed, updatedAt: new Date().toISOString() } : c
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
        const usedBy = d.costs.filter((c) => c.categoryId === id).length;
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
      data.costs.filter((c) => c.categoryId === categoryId).length,
    [data.costs]
  );

  const getCost = useCallback(
    (id: string) => data.costs.find((c) => c.id === id),
    [data.costs]
  );

  const getCategory = useCallback(
    (id: string) => data.categories.find((c) => c.id === id),
    [data.categories]
  );

  const resetToSample = useCallback(() => {
    setData({ costs: SEED_COSTS, categories: SEED_COST_CATEGORIES });
  }, []);

  const value = useMemo<CostStoreValue>(
    () => ({
      ...data,
      getCost,
      getCategory,
      addCost,
      updateCost,
      deleteCost,
      addCategory,
      renameCategory,
      deleteCategory,
      categoryUsage,
      resetToSample,
    }),
    [
      data,
      getCost,
      getCategory,
      addCost,
      updateCost,
      deleteCost,
      addCategory,
      renameCategory,
      deleteCategory,
      categoryUsage,
      resetToSample,
    ]
  );

  return <CostContext.Provider value={value}>{children}</CostContext.Provider>;
}

export function useCostStore(): CostStoreValue {
  const ctx = useContext(CostContext);
  if (!ctx) {
    throw new Error("useCostStore باید داخل CostProvider استفاده شود");
  }
  return ctx;
}
