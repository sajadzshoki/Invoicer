import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CalendarRange } from "lucide-react";
import { BottomSheet } from "@/components/ui/Overlay";
import { Button } from "@/components/ui/Button";
import { DatePickerTrigger, Field } from "@/components/ui/Field";
import { DateSelectSheet } from "@/components/party/DateSelectSheet";
import { cn } from "@/lib/cn";
import { faDateLong, todayIso } from "@/lib/jalali";
import {
  REPORT_RANGE_LABEL,
  REPORT_RANGE_PRESETS,
  resolveReportRange,
  type ReportRange,
  type ReportRangePreset,
} from "./range";

/**
 * وضعیت بازهٔ تاریخ مشترک همهٔ گزارش‌ها.
 * فقط برای «جلسهٔ گزارش» نگهداری می‌شود (sessionStorage) — نه دائمی.
 */

const STORAGE_KEY = "nasagh:reportRange:v1";

interface StoredRange {
  preset: ReportRangePreset;
  custom?: ReportRange;
}

interface ReportRangeValue {
  preset: ReportRangePreset;
  custom?: ReportRange;
  /** بازهٔ حل‌شده برای فیلتر داده‌ها */
  range: ReportRange;
  setPreset: (preset: ReportRangePreset) => void;
  setCustom: (custom: ReportRange) => void;
}

const ReportRangeContext = createContext<ReportRangeValue | null>(null);

function loadStored(): StoredRange {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredRange;
      if (parsed && parsed.preset) return parsed;
    }
  } catch {
    /* دسترسی به حافظهٔ جلسه نبود */
  }
  return { preset: "month" };
}

export function ReportRangeProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<StoredRange>(loadStored);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      /* ذخیرهٔ جلسه در دسترس نبود */
    }
  }, [stored]);

  const setPreset = useCallback((preset: ReportRangePreset) => {
    setStored((s) => ({ ...s, preset }));
  }, []);

  const setCustom = useCallback((custom: ReportRange) => {
    setStored({ preset: "custom", custom });
  }, []);

  const value = useMemo<ReportRangeValue>(() => {
    return {
      preset: stored.preset,
      custom: stored.custom,
      range: resolveReportRange(stored.preset, stored.custom),
      setPreset,
      setCustom,
    };
  }, [stored, setPreset, setCustom]);

  return (
    <ReportRangeContext.Provider value={value}>
      {children}
    </ReportRangeContext.Provider>
  );
}

export function useReportRange(): ReportRangeValue {
  const ctx = useContext(ReportRangeContext);
  if (!ctx) {
    throw new Error("useReportRange باید داخل ReportRangeProvider استفاده شود");
  }
  return ctx;
}

/* ------------------------------ انتخابگر بازه ------------------------------ */

export interface ReportRangePickerProps {
  className?: string;
}

/** انتخابگر بازهٔ گزارش — چیپ‌های پیش‌تنظیم + بازهٔ دلخواه جلالی */
export function ReportRangePicker({ className }: ReportRangePickerProps) {
  const { preset, custom, setPreset, setCustom } = useReportRange();
  const [customOpen, setCustomOpen] = useState(false);
  const [picking, setPicking] = useState<"none" | "from" | "to">("none");
  const [draftFrom, setDraftFrom] = useState<string | undefined>(custom?.from);
  const [draftTo, setDraftTo] = useState<string | undefined>(custom?.to);

  const openCustom = () => {
    setDraftFrom(custom?.from);
    setDraftTo(custom?.to);
    setCustomOpen(true);
  };

  const applyCustom = () => {
    if (!draftFrom || !draftTo) return;
    setCustom({ from: draftFrom, to: draftTo });
    setCustomOpen(false);
  };

  return (
    <>
      <div
        className={cn("range-picker", className)}
        role="group"
        aria-label="بازهٔ زمانی گزارش"
      >
        {REPORT_RANGE_PRESETS.map((p) => {
          const isCustom = p === "custom";
          const isActive = preset === p;
          return (
            <button
              key={p}
              type="button"
              className={cn("range-picker__chip", isActive && "is-active")}
              aria-pressed={isActive}
              onClick={() => (isCustom ? openCustom() : setPreset(p))}
            >
              {isCustom && <CalendarRange size={14} aria-hidden />}
              {REPORT_RANGE_LABEL[p]}
            </button>
          );
        })}
      </div>

      {/* برگهٔ بازهٔ دلخواه */}
      <BottomSheet
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        title="بازه دلخواه"
      >
        <div className="range-custom">
          <Field label="از تاریخ">
            <DatePickerTrigger
              value={draftFrom ? faDateLong(draftFrom) : undefined}
              onChange={() => setPicking("from")}
            />
          </Field>
          <Field label="تا تاریخ">
            <DatePickerTrigger
              value={draftTo ? faDateLong(draftTo) : undefined}
              onChange={() => setPicking("to")}
            />
          </Field>
          {!draftFrom || !draftTo ? (
            <p className="range-custom__hint">هر دو تاریخ را انتخاب کنید.</p>
          ) : null}
        </div>
        <div className="range-custom__actions">
          <Button block disabled={!draftFrom || !draftTo} onClick={applyCustom}>
            اعمال بازه
          </Button>
          <Button block variant="ghost" onClick={() => setCustomOpen(false)}>
            انصراف
          </Button>
        </div>
      </BottomSheet>

      <DateSelectSheet
        open={picking !== "none"}
        onClose={() => setPicking("none")}
        title={picking === "from" ? "از تاریخ" : "تا تاریخ"}
        value={picking === "from" ? draftFrom ?? todayIso() : draftTo ?? todayIso()}
        onSelect={(iso) => {
          if (picking === "from") setDraftFrom(iso);
          else setDraftTo(iso);
          setPicking("none");
        }}
      />
    </>
  );
}

/** برچسب متنی بازهٔ فعلی برای نمایش در سربرگ چاپ */
export function useReportRangeLabel(): string {
  const { range } = useReportRange();
  return `${faDateLong(range.from)} تا ${faDateLong(range.to)}`;
}
