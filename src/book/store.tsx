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
  BookAccountTransaction,
  BookAccountTransactionType,
  PartyNote,
  PartyReminder,
  Person,
} from "./types";
import {
  SEED_NOTES,
  SEED_PERSONS,
  SEED_REMINDERS,
  SEED_TRANSACTIONS,
} from "./seed";

/**
 * مخزن دادهٔ محلی ماژول طرف حساب‌ها
 * در فازهای بعد با لایهٔ اتصال به بک‌اند جایگزین می‌شود؛
 * امضای متدها طوری طراحی شده که آن جایگزینی کم‌هزینه باشد.
 */

const STORAGE_KEY = "nasagh:book:v2";

interface BookData {
  persons: Person[];
  transactions: BookAccountTransaction[];
  notes: PartyNote[];
  reminders: PartyReminder[];
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadInitial(): BookData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BookData;
      // آرایه‌های اصلی معتبر باشند کافی است؛ زیرمجموعه‌های اختیاریِ گم‌شده
      // با آرایهٔ خالی پر می‌شوند تا دادهٔ معتبر هرگز دور ریخته نشود.
      if (Array.isArray(parsed.persons) && Array.isArray(parsed.transactions)) {
        return {
          persons: parsed.persons,
          transactions: parsed.transactions,
          notes: Array.isArray(parsed.notes) ? parsed.notes : [],
          reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
        };
      }
    }
  } catch {
    /* دادهٔ خراب → شروع با دادهٔ نمونه */
  }
  return {
    persons: SEED_PERSONS,
    transactions: SEED_TRANSACTIONS,
    notes: SEED_NOTES,
    reminders: SEED_REMINDERS,
  };
}

export interface AddPartyInput {
  name: string;
  phone?: string;
  address?: string;
  birthDate?: string;
}

export interface TransactionInput {
  personId: string;
  type: BookAccountTransactionType;
  amount: number;
  date: string;
  description?: string;
  /** اتصال به فاکتور — برای ردیابی و بازگشت اثر مالی فاکتورها */
  invoiceId?: string;
  /** اتصال به چک — برای ردیابی و بازگشت اثر مالی چک‌ها */
  chequeId?: string;
}

interface BookStoreValue extends BookData {
  addParty: (input: AddPartyInput) => Person;
  updateParty: (id: string, input: AddPartyInput) => Person | null;
  deleteParty: (id: string) => void;
  addTransaction: (input: TransactionInput) => BookAccountTransaction;
  /**
   * حذف همهٔ رکوردهای متصل به یک فاکتور (برای ویرایش/حذف فاکتور).
   * ماندهٔ شخص به‌طور خودکار از روی رکوردهای باقی‌مانده بازخوانی می‌شود.
   */
  removeTransactionsForInvoice: (invoiceId: string) => void;
  /**
   * حذف همهٔ رکوردهای متصل به یک چک (برای تغییر وضعیت/ویرایش/حذف چک).
   */
  removeTransactionsForCheque: (chequeId: string) => void;
  addNote: (personId: string, text: string) => PartyNote;
  updateNote: (noteId: string, text: string) => void;
  deleteNote: (noteId: string) => void;
  addReminder: (input: Omit<PartyReminder, "id" | "createdAt">) => PartyReminder;
  deleteReminder: (reminderId: string) => void;
  resetToSample: () => void;
}

const BookStoreContext = createContext<BookStoreValue | null>(null);

export function BookProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BookData>(loadInitial);

  // ذخیرهٔ محلی برای ماندگاری بین بازدیدها
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* در دسترس نبودن حافظهٔ محلی مهم نیست */
    }
  }, [data]);

  const addParty = useCallback((input: AddPartyInput): Person => {
    const person: Person = {
      id: makeId("p"),
      name: input.name.trim(),
      phone: input.phone?.trim() || undefined,
      address: input.address?.trim() || undefined,
      birthDate: input.birthDate || undefined,
      createdAt: new Date().toISOString(),
    };
    setData((d) => ({ ...d, persons: [person, ...d.persons] }));
    return person;
  }, []);

  const updateParty = useCallback(
    (id: string, input: AddPartyInput): Person | null => {
      let updated: Person | null = null;
      setData((d) => ({
        ...d,
        persons: d.persons.map((p) => {
          if (p.id !== id) return p;
          updated = {
            ...p,
            name: input.name.trim(),
            phone: input.phone?.trim() || undefined,
            address: input.address?.trim() || undefined,
            birthDate: input.birthDate || undefined,
          };
          return updated;
        }),
      }));
      return updated;
    },
    []
  );

  const deleteParty = useCallback((id: string) => {
    setData((d) => ({
      persons: d.persons.filter((p) => p.id !== id),
      transactions: d.transactions.filter((t) => t.personId !== id),
      notes: d.notes.filter((n) => n.personId !== id),
      reminders: d.reminders.filter((r) => r.personId !== id),
    }));
  }, []);

  const addTransaction = useCallback(
    (input: TransactionInput): BookAccountTransaction => {
      const tx: BookAccountTransaction = {
        id: makeId("t"),
        personId: input.personId,
        type: input.type,
        amount: input.amount,
        date: input.date,
        description: input.description?.trim() || undefined,
        invoiceId: input.invoiceId,
        chequeId: input.chequeId,
        createdAt: new Date().toISOString(),
      };
      setData((d) => ({ ...d, transactions: [tx, ...d.transactions] }));
      return tx;
    },
    []
  );

  const removeTransactionsForInvoice = useCallback((invoiceId: string) => {
    setData((d) => ({
      ...d,
      // رکوردهای ساخته‌شده توسط چک‌ها (تگ chequeId) به خود چک تعلق دارند و
      // چرخهٔ زندگی‌شان با ذخیره/تغییر وضعیت چک مدیریت می‌شود؛ پس هنگام
      // ویرایش/حذف فاکتور حذف نمی‌شوند تا اثر مالی چک‌ها گم نشود.
      transactions: d.transactions.filter(
        (t) => t.invoiceId !== invoiceId || t.chequeId !== undefined
      ),
    }));
  }, []);

  const removeTransactionsForCheque = useCallback((chequeId: string) => {
    setData((d) => ({
      ...d,
      transactions: d.transactions.filter((t) => t.chequeId !== chequeId),
    }));
  }, []);

  const addNote = useCallback((personId: string, text: string): PartyNote => {
    const note: PartyNote = {
      id: makeId("n"),
      personId,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setData((d) => ({ ...d, notes: [note, ...d.notes] }));
    return note;
  }, []);

  const updateNote = useCallback((noteId: string, text: string) => {
    setData((d) => ({
      ...d,
      notes: d.notes.map((n) =>
        n.id === noteId
          ? { ...n, text: text.trim(), updatedAt: new Date().toISOString() }
          : n
      ),
    }));
  }, []);

  const deleteNote = useCallback((noteId: string) => {
    setData((d) => ({ ...d, notes: d.notes.filter((n) => n.id !== noteId) }));
  }, []);

  const addReminder = useCallback(
    (input: Omit<PartyReminder, "id" | "createdAt">): PartyReminder => {
      const reminder: PartyReminder = {
        ...input,
        id: makeId("r"),
        createdAt: new Date().toISOString(),
      };
      setData((d) => ({ ...d, reminders: [reminder, ...d.reminders] }));
      return reminder;
    },
    []
  );

  const deleteReminder = useCallback((reminderId: string) => {
    setData((d) => ({
      ...d,
      reminders: d.reminders.filter((r) => r.id !== reminderId),
    }));
  }, []);

  const resetToSample = useCallback(() => {
    setData({
      persons: SEED_PERSONS,
      transactions: SEED_TRANSACTIONS,
      notes: SEED_NOTES,
      reminders: SEED_REMINDERS,
    });
  }, []);

  const value = useMemo<BookStoreValue>(
    () => ({
      ...data,
      addParty,
      updateParty,
      deleteParty,
      addTransaction,
      removeTransactionsForInvoice,
      removeTransactionsForCheque,
      addNote,
      updateNote,
      deleteNote,
      addReminder,
      deleteReminder,
      resetToSample,
    }),
    [
      data,
      addParty,
      updateParty,
      deleteParty,
      addTransaction,
      removeTransactionsForInvoice,
      removeTransactionsForCheque,
      addNote,
      updateNote,
      deleteNote,
      addReminder,
      deleteReminder,
      resetToSample,
    ]
  );

  return (
    <BookStoreContext.Provider value={value}>
      {children}
    </BookStoreContext.Provider>
  );
}

export function useBookStore(): BookStoreValue {
  const ctx = useContext(BookStoreContext);
  if (!ctx) {
    throw new Error("useBookStore باید داخل BookProvider استفاده شود");
  }
  return ctx;
}
