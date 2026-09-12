import { useState } from "react";
import { Clock } from "lucide-react";
import { BottomSheet } from "@/components/ui/Overlay";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { toEnDigits } from "@/lib/fa";

export interface TimeSelectSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  value?: string;
  onSelect: (time: string) => void;
}

const PRESETS = ["۰۹:۰۰", "۱۲:۰۰", "۱۵:۰۰", "۱۸:۰۰", "۲۱:۰۰"];

function normalizeTime(raw: string): string {
  return toEnDigits(raw).replace(/\s/g, "").slice(0, 5);
}

function isValidTime(t: string): boolean {
  const m = /^(\d{1,2}):(\d{1,2})$/.exec(t);
  if (!m) return false;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h >= 0 && h <= 23 && min >= 0 && min <= 59;
}

const fa2 = (n: string | number) =>
  String(n).padStart(2, "0").replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

/** انتخاب ساعت — میان‌برهای پرکاربرد + ورود دستی */
export function TimeSelectSheet({
  open,
  onClose,
  title = "انتخاب ساعت",
  value,
  onSelect,
}: TimeSelectSheetProps) {
  const [manual, setManual] = useState("");
  const [error, setError] = useState<string | undefined>();

  const pick = (t: string) => {
    onSelect(t);
    onClose();
  };

  const submitManual = () => {
    const t = normalizeTime(manual);
    if (!isValidTime(t)) {
      setError("ساعت را با قالب درست وارد کنید؛ مثل ۱۴:۳۰");
      return;
    }
    const [h, m] = t.split(":");
    pick(`${h.padStart(2, "0")}:${m.padStart(2, "0")}`);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="chip-row" role="group" aria-label="ساعت‌های پیشنهادی">
        {PRESETS.map((p) => {
          const en = toEnDigits(p);
          const active = value === en;
          return (
            <button
              key={p}
              type="button"
              className={cn("chip", active && "is-active")}
              onClick={() => pick(en)}
            >
              <Clock size={16} aria-hidden />
              {p}
            </button>
          );
        })}
      </div>

      <div className="sheet-section">
        <Field label="ساعت دستی" error={error} htmlFor="time-manual">
          <Input
            id="time-manual"
            value={manual}
            invalid={!!error}
            placeholder={fa2("14") + ":" + fa2("30")}
            inputMode="numeric"
            onChange={(e) => {
              setManual(e.target.value);
              setError(undefined);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitManual();
            }}
          />
        </Field>
        <Button block className="mt-4" onClick={submitManual} disabled={!manual.trim()}>
          تأیید ساعت
        </Button>
      </div>
    </BottomSheet>
  );
}

/** نمایش ساعت با ارقام فارسی */
export function formatTimeFa(time: string): string {
  const [h, m] = time.split(":");
  return `${fa2(h)}:${fa2(m)}`;
}
